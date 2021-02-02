import { DO_NOTHING } from '@lib/common-utils';
import {
  createMemo,
  SetStateFunction,
  JSX,
  createSignal,
  createRoot,
  createComputed,
  onCleanup,
} from 'solid-js';
import {
  createSearchByNameFn,
  ExecuteSearchFunction,
  ResultsInfo,
  SearchResults,
  SearchResultsKey,
} from './search';
import { isEnterKey } from '../browser-utils';
import { LogContentPairs, logger, shouldLog } from '../logger';
import { FirebaseDb } from '../../typings/firebase-sdk';

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

      logger.log({ prefix: 'On Refresh' }, 'Key', refreshKey || 'All Keys');

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
    getLastTargetName,
    setLastTargetName,
  });
  return (event) => {
    if (isEnterKey(event)) {
      searchFn(event.target.value);
    }
  };
}

export function createPageCountLogger(searchResults: SearchResults) {
  if (shouldLog({ prefix: 'Page Count' })) {
    onCleanup(
      createRoot((...dispose) => {
        type PageCountObject = Record<SearchResultsKey, number>;

        const pageCounts = createMemo(
          () => {
            return {
              byName: searchResults.byName.pageCount,
              byMembersCount: searchResults.byMembersCount.pageCount,
              byCreatedTime: searchResults.byCreatedTime.pageCount,
            };
          },
          {} as PageCountObject,
          (prev, next) =>
            searchResultsKeyArray.every((key) => prev[key] === next[key]),
        );

        createComputed((prev = {} as PageCountObject) => {
          const currentPageCount = pageCounts();
          let logContents: LogContentPairs = [];
          searchResultsKeyArray.forEach((key) => {
            const prevCount = prev[key];
            const currentCount = currentPageCount[key];
            logContents = logContents.concat([
              [
                key,
                ...(currentCount === prevCount ? [] : [prevCount, '->']),
                currentCount,
              ],
            ]);
          });
          logger.logMultiLines(
            { prefix: 'Page Count', skipCheck: true },
            logContents,
          );
          return currentPageCount;
        }, {} as PageCountObject);
        return dispose[0];
      }),
    );
  }
}
