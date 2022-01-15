import { useRouter } from "next/router";
import React, { useState } from "react";
import { useSWRInfinite } from "swr";

import ArticlePreview from "./ArticlePreview";
import ErrorMessage from "../common/ErrorMessage";
import LoadingSpinner from "../common/LoadingSpinner";
// import usePagination from "../common/Pagination";
import {
  usePageCountState,
  usePageCountDispatch,
} from "../../lib/context/PageCountContext";
import useViewport from "../../lib/hooks/useViewport";
import { SERVER_BASE_URL, DEFAULT_LIMIT } from "../../lib/utils/constant";
import fetcher from "../../lib/utils/fetcher";
import { useInView } from "react-intersection-observer";
import { getPageInfo } from "lib/utils/calculatePagination";

const getFetchURL = (router) => {
  let fetchURL = `${SERVER_BASE_URL}/articles?limit=5&offset=`;
  const { asPath, pathname, query } = router;
  const { favorite, follow, tag, pid } = query;

  const isProfilePage = pathname.startsWith(`/profile`);
  switch (true) {
    case !!tag:
      fetchURL = `${SERVER_BASE_URL}/articles${asPath}&limit=5&offset=`;
      break;
    case isProfilePage && !!favorite:
      fetchURL = `${SERVER_BASE_URL}/articles?favorited=${encodeURIComponent(
        String(pid)
      )}&limit=5&offset=`;
      break;
    case isProfilePage && !favorite:
      fetchURL = `${SERVER_BASE_URL}/articles?author=${encodeURIComponent(
        String(pid)
      )}&limit=5&offset=`;
      break;
    case !isProfilePage && !!follow:
      fetchURL = `${SERVER_BASE_URL}/articles/feed?limit=5&offset=`;
      break;
    default:
      break;
  }
  return fetchURL;
};

const ArticleList = () => {
  const [page, setPage] = useState(0);
  const router = useRouter();
  const pageCount = usePageCountState();
  const setPageCount = usePageCountDispatch();
  const { ref: bottomRef, inView: bottomInView } = useInView();
  let fetchURL = getFetchURL(router);

  const getKey = (page: number, data: any) => {
    let url: string;
    if (data) {
      url = `${fetchURL}${page * 5}`;
    } else {
      url = `${fetchURL}0`;
    }
    return url;
  };

  //@ts-ignore
  const { data, error, size, setSize } = useSWRInfinite(getKey, fetcher);

  if (error) {
    return (
      <div className="col-md-9">
        <div className="feed-toggle">
          <ul className="nav nav-pills outline-active"></ul>
        </div>
        <ErrorMessage message="Cannot load recent articles..." />
      </div>
    );
  }

  if (data === undefined) return <LoadingSpinner />;

  // const { hasNextPage } = getPageInfo({
  //   limit: DEFAULT_LIMIT,
  //   pageCount,
  //   total: data[0].articlesCount, // TODO: use the last page's count.
  //   page: page,
  // });
  console.log({ data });
  const hasNextPage = data[0].articlesCount > size * 5;

  if (bottomInView && hasNextPage) {
    console.log(`setting size: ${size + 1}`);
    setSize(size + 1);
  }

  return (
    <>
      {data.map(({ articles }) => {
        return articles?.map((article) => (
          <ArticlePreview key={article.slug} article={article} />
        ));
      })}
      {hasNextPage && <div ref={bottomRef} />}
    </>
  );
};

export default ArticleList;
