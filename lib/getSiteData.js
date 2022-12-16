import fs from 'fs';
import path from 'path';
import glob from 'glob';
import config from '../next-collections.config';
import { chunk, kebabCase } from 'lodash';
import * as matter from 'gray-matter';

const { site, collections, postsPerPage } = config;

const getPageData = (collection) => (file) => {
  const idBase = path.join(collection, file.split(collection)[1]);
  const id = kebabCase(idBase).replace(/-md$/g, '').replace(/-mdx$/g, '');

  const fileStats = fs.statSync(file);
  const _rawContent = fs.readFileSync(file, 'utf8');
  const { data, isEmpty, excerpt, content } = matter(_rawContent, {
    excerpt_separator: '<!-- more -->',
  });

  const createdAt = fileStats.birthtime.toGMTString();
  const updatedAt = fileStats.mtime.toGMTString();

  return {
    collection,
    id,
    content,
    data,
    isEmpty,
    excerpt,
    createdAt,
    updatedAt,
  };
};

export const getSiteData = (slug = ['index']) => {
  const lastSlug = slug.pop();
  const isPage = Number(lastSlug) > 0;
  const finalSlugs = isPage ? slug : [...slug, lastSlug];

  const allCollections = collections
    .map((collection) => {
      const collectionDir = path.join(process.cwd(), '_content', collection);
      const collectionFiles = glob.sync(`${collectionDir}/**/*.{md,mdx}`);
      const collectionData = collectionFiles.map(getPageData(collection));

      return [collection, collectionData];
    })
    .reduce((acc, [collection, collectionData]) => {
      const posts = collectionData;
      const pages = chunk(posts, postsPerPage);
      const totalPages = pages.length;
      const totalPosts = posts.length;

      return {
        ...acc,
        postsPerPage,
        [collection]: {
          posts,
          pages,
          postsPerPage,
          totalPages,
          totalPosts,
        },
      };
    }, {});

  return {
    ...site,
    collections: allCollections || [],
    currentPage: isPage ? Number(lastSlug) : 1,
  };
};
