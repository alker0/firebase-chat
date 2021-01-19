import { DO_NOTHING } from '@components/common/util/component-utils';
import {
  createMemo,
  SetStateFunction,
  JSX,
  createRoot,
  createComputed,
  untrack,
  createSignal,
} from 'solid-js';
import { FirebaseDb } from '../../typings/firebase-sdk';
import {
  createSearchByNameFn,
  ExecuteSearchFunction,
  ResultsInfo,
  SearchResults,
  SearchResultsKey,
} from './search';

export const initialResultsInfo: ResultsInfo = {
  pageCount: 0,
  resultList: [],
};

export const searchResultsKeyArray = [
  'byName',
  'byMembersCount',
  'byCreatedTime',
] as const;

const minuteMili = 60000;
const hourMili = minuteMili * 60;
const dayMili = hourMili * 24;

export function getOldnessText(targetTime: number): string {
  const oldnessMili = Date.now() - targetTime;
  if (oldnessMili < minuteMili) {
    return `${Math.floor(oldnessMili / 1000)} seconds`;
  } else if (oldnessMili < hourMili) {
    return `${Math.floor(oldnessMili / minuteMili)} minutes`;
  } else if (oldnessMili < dayMili) {
    return `${Math.floor(oldnessMili / hourMili)} hours`;
  } else {
    return '';
  }
}

interface RefreshState {
  promise: Promise<ResultsInfo>;
  resolve: () => void;
}

export function createRefreshState(
  refreshSignal: () => void | SearchResultsKey,
  setSearchResults: SetStateFunction<SearchResults>,
) {
  const refreshMemo = createMemo(
    (
      { resolve: prevResolve }: RefreshState = {
        resolve: DO_NOTHING,
        promise: Promise.resolve(initialResultsInfo),
      },
    ) => {
      const refreshKey = refreshSignal();

      prevResolve();
      console.log('[On Refresh]');
      let refreshResolveFn = DO_NOTHING;
      const refreshPromise = new Promise<ResultsInfo>((resolve) => {
        refreshResolveFn = () => resolve(initialResultsInfo);
      });

      setSearchResults(
        refreshKey || [...searchResultsKeyArray],
        initialResultsInfo,
      );

      return {
        promise: refreshPromise,
        resolve: refreshResolveFn,
      };
    },
  );

  return {
    get promise() {
      return refreshMemo().promise;
    },
    get resolve() {
      return refreshMemo().resolve;
    },
  };
}

export function createSearchByNameHandler(
  executeFn: ExecuteSearchFunction,
  db: FirebaseDb,
): JSX.InputHTMLAttributes<HTMLInputElement>['onKeyDown'] {
  const [getLastTargetName, setLastTargetName] = createSignal('');
  const searchFn = createSearchByNameFn(executeFn, {
    db,
    getLastTargetName: () => untrack(getLastTargetName),
    setLastTargetName,
  });
  return (event) => {
    if (event.key ? event.key === 'Enter' : event.keyCode === 13) {
      searchFn(event.target.value);
    }
  };
}

export function createPageCountLogger(searchResults: SearchResults) {
  return createRoot((...dispose) => {
    const pageCounts = createMemo(
      () => {
        return {
          byName: searchResults.byName.pageCount,
          byMembersCount: searchResults.byMembersCount.pageCount,
          byCreatedTime: searchResults.byCreatedTime.pageCount,
        };
      },
      {} as Record<SearchResultsKey, number>,
      (prev, next) =>
        searchResultsKeyArray.every((key) => prev[key] === next[key]),
    );

    createComputed((prev = {} as Record<SearchResultsKey, number>) => {
      const currentPageCounts = pageCounts();
      searchResultsKeyArray.forEach((key) => {
        console.log(
          `[Page Counts]${key}:`,
          prev[key],
          '->',
          currentPageCounts[key],
        );
      });
      return currentPageCounts;
    }, {} as Record<SearchResultsKey, number>);
    return dispose[0];
  });
}
