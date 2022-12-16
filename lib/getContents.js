import fs from 'fs';
import path from 'path';
import glob from 'glob';
import { kebabCase } from 'lodash';

import * as matter from 'gray-matter';
import { bundleMDX } from 'mdx-bundler';

import remarkGfm from 'remark-gfm';
import { remarkMdxCodeMeta } from 'remark-mdx-code-meta';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

import flow from 'esbuild-plugin-flow';
import svgrPlugin from 'esbuild-plugin-svgr';

import config from '../next-collections.config';
const { site, collections, postsPerPage } = config;

const ROOT_CONTENT_DIR = path.join(process.cwd(), '_content');
const headingRegEx = /^(#{1,6})\s(.+)/gm;

export async function getAllStaticPaths() {
  const collectionsData = collections.reduce((acc, collection) => {
    return {
      ...acc,
      [collection]: {
        posts: 0,
        pages: 1,
      },
    };
  }, {});

  const collectionParams = [];
  const allContentMarkdownFiles = glob.sync(
    `${ROOT_CONTENT_DIR}/**/*.{md,mdx}`
  );

  const contentFileParams = allContentMarkdownFiles.map((file) => {
    const slug = file
      .replace(ROOT_CONTENT_DIR, '')
      .replace(/\.mdx?$/, '')
      .split('/')
      .filter(Boolean);

    const isCollection = collections.includes(slug[0]);
    if (isCollection) {
      collectionsData[slug[0]].posts++;
    }

    return {
      params: {
        slug,
      },
    };
  });

  Object.entries(collectionsData).forEach(([collection, data]) => {
    const numberOfPages = Math.ceil(data.posts / postsPerPage);
    for (let i = 1; i <= numberOfPages; i++) {
      collectionParams.push({
        params: {
          slug: [collection, i.toString()],
        },
      });
    }
  });

  const homepage = { params: { slug: [''] } };
  return [homepage, ...collectionParams, ...contentFileParams];
}

const getHeadingGroups = (content) => {
  const headingMap = {};
  const matches = [...content.matchAll(headingRegEx)];
  const allHeadings = matches.map((match) => {
    const [, hashes, label] = match;
    const level = hashes.length;
    const slug = kebabCase(label.toLowerCase());
    const doesHeadingExist = typeof headingMap[slug] !== 'undefined';
    headingMap[slug] = doesHeadingExist ? headingMap[slug] + 1 : 0;
    const count = headingMap[slug];

    return {
      depth: level,
      value: label,
      slug: `${slug}${count > 0 ? `-${count}` : ''}`,
    };
  });

  return allHeadings;
};

export async function getPageContents(slug = ['index']) {
  const lastSlug = slug.pop();
  const isPage = Number(lastSlug) > 0;
  const finalSlugs = isPage ? slug : [...slug, lastSlug];

  const searchPath = `${path.join(ROOT_CONTENT_DIR, ...finalSlugs)}.{md,mdx}`;
  const contentFilePaths = glob.sync(searchPath);
  const [contentFilePath] = contentFilePaths;

  const {
    code,
    frontmatter,
    matter: mdxMatter,
  } = await bundleMDX({
    file: contentFilePath,
    xdmOptions(options) {
      options.remarkPlugins = [
        ...(options.remarkPlugins ?? []),
        remarkGfm,
        remarkMdxCodeMeta,
      ];
      options.rehypePlugins = [
        ...(options.rehypePlugins ?? []),
        rehypeSlug,
        rehypeAutolinkHeadings,
      ];

      return options;
    },
    esbuildOptions(options) {
      options.target = ['es2019'];
      const flowPlugin = flow(/\.jsx?$/, true);
      const svgPlugin = svgrPlugin({
        typescript: false,
      });

      options.plugins = [flowPlugin, svgPlugin, ...options.plugins];
      return options;
    },
  });
  const headings = getHeadingGroups(mdxMatter.content);

  return {
    frontMatter: frontmatter,
    mdx: code,
    headings,
  };
}
