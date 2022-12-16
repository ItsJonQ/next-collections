import React from 'react';
import { useSiteContext } from '../providers/SiteProvider';

const usePagination = () => {
  const siteContext = useSiteContext();
  const [collectionName] = siteContext?.params?.slug || [];

  if (!collectionName) return {};

  const collectionData = siteContext?.collections?.[collectionName] || {};
  const pages = collectionData?.pages || [];
  const currentPage = siteContext.currentPage || 1;
  const posts = pages[currentPage];

  const firstPage = 1;
  const lastPage = 1;
  const isFirstPage = currentPage === firstPage;
  const isLastPage = currentPage === lastPage;

  const currentPageLink = `/${collectionName}/${currentPage}`;
  const firstPageLink = `/${collectionName}/${firstPage}`;
  const lastPageLink = `/${collectionName}/${isLastPage}`;

  const prevPageLink = isFirstPage
    ? firstPageLink
    : `/${collectionName}/${currentPage - 1}`;

  const nextPageLink = isLastPage
    ? lastPageLink
    : `/${collectionName}/${currentPage + 1}`;

  const pageLinks = pages.map((_, index) => `/${collectionName}/${index + 1}`);

  return {
    currentPage,
    currentPageLink,
    firstPageLink,
    isFirstPage,
    isLastPage,
    lastPageLink,
    nextPageLink,
    pageLinks,
    prevPageLink,
  };
};

export const Pagination = () => {
  const pagination = usePagination();
  console.log(pagination);

  return <div>Hello</div>;
};
