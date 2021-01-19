import {
  searchRoomsByName,
  searchRoomsByMembersCount,
  searchRoomsByCreatedTime,
  ResultsInfoBase,
  executeSearchRooms,
} from './rtdb';
import { arrayFromSnapshot as arrayFromSnapshotUtil } from '../rtdb/utils';
import { FirebaseDb, FirebaseDbSnapshot } from '../../typings/firebase-sdk';

// export type SearchResultsKey = `by${'Name' | 'MembersCount' | 'CreatedTime'}`;
export type SearchResultsKey = 'byName' | 'byMembersCount' | 'byCreatedTime';

export interface RoomRow {
  roomId: string | null;
  roomName: string;
  membersCount: number;
  createdTime: number;
}

export interface ResultsInfo extends ResultsInfoBase<RoomRow> {}

export interface SearchResults extends Record<SearchResultsKey, ResultsInfo> {}

export interface SearchBaseOption {
  getRequestedPage: () => number;
  getRefreshPromise: () => Promise<ResultsInfo>;
  getPreviousResults: SearchResults;
  resultHandleFn: (
    targetKey: SearchResultsKey,
    loadResultInfo: () => Promise<ResultsInfo>,
  ) => void;
}

export interface ExecuteSearchOption {
  targetKey: SearchResultsKey;
  searchRunner: (prev: ResultsInfo) => Promise<FirebaseDbSnapshot>;
  descending?: boolean;
  skipCondition?: () => boolean;
  onSuccess?: (resultsInfo: ResultsInfo) => void;
}

function arrayFromSnapshot(snapshot: FirebaseDbSnapshot, descending?: boolean) {
  return arrayFromSnapshotUtil<RoomRow>(
    snapshot,
    (data) => {
      const dataValues = data.val();
      return {
        roomId: data.key,
        roomName: dataValues.room_name,
        membersCount: dataValues.members_count,
        createdTime: dataValues.created_at,
      };
    },
    {
      descending,
      onNoChild: () => {
        console.log('[Get Array]Not Has Children Value:', snapshot.val());
      },
    },
  );
}

export interface ExecuteSearchFunction {
  (executeArg: ExecuteSearchOption): void;
}

export function createExecuteSearchFn(
  searchOption: SearchBaseOption,
  wrapperFn: (executeFn: () => void) => void = (executeFn) => executeFn(),
): ExecuteSearchFunction {
  return function executeSearch(executeArg: ExecuteSearchOption) {
    wrapperFn(function executeSearchRunner() {
      const requestedPage = searchOption.getRequestedPage();

      const prevResults = searchOption.getPreviousResults[executeArg.targetKey];

      console.log(
        '[Execute Search]Requested Page:',
        requestedPage,
        '/',
        'Already Loaded Page:',
        prevResults.pageCount,
      );

      executeSearchRooms({
        targetPage: requestedPage,
        previous: prevResults,
        searchRunner: async (prev) =>
          arrayFromSnapshot(
            await executeArg.searchRunner(prev),
            executeArg.descending,
          ),
        resultHandleFn: (searchPromise) => {
          searchOption.resultHandleFn(executeArg.targetKey, () =>
            Promise.race([
              searchOption.getRefreshPromise(),
              (async () => {
                try {
                  const resultInfo = await searchPromise;

                  executeArg.onSuccess?.(resultInfo);

                  return resultInfo;
                } catch (error) {
                  console.error(error);
                  return prevResults;
                }
              })(),
            ]),
          );
        },
        skipCondition: executeArg.skipCondition,
      });
    });
  };
}

function getLastElement<T>(array: T[]) {
  return array.slice(-1)[0];
}

interface SearchByNameOption {
  db: FirebaseDb;
  getLastTargetName: () => string;
  setLastTargetName: (name: string) => void;
}

export function createSearchByNameFn(
  executeFn: ExecuteSearchFunction,
  option: SearchByNameOption,
) {
  return function searchByName(name: string) {
    const targetName = name.trim();
    if (targetName.length) {
      const isSameName = targetName === option.getLastTargetName();
      executeFn({
        targetKey: 'byName',
        searchRunner: (prev) => {
          const prevLast = getLastElement(prev.resultsList);
          return searchRoomsByName(option.db, targetName, prevLast?.roomId);
        },
        skipCondition: () => isSameName,
        onSuccess: () => option.setLastTargetName(targetName),
      });
    }
  };
}

interface SearchByMembersCountOption {
  db: FirebaseDb;
}

export function searchByMembersCount(
  executeFn: ExecuteSearchFunction,
  option: SearchByMembersCountOption,
) {
  executeFn({
    targetKey: 'byMembersCount',
    searchRunner: (prev) => {
      const prevLast = getLastElement(prev.resultsList);
      return searchRoomsByMembersCount(
        option.db,
        prevLast
          ? {
              count: prevLast.membersCount,
              key: prevLast.roomId,
            }
          : undefined,
      );
    },
    descending: true,
  });
}

interface SearchByCreatedTimeOption {
  db: FirebaseDb;
}

export function searchByCreatedTime(
  executeFn: ExecuteSearchFunction,
  option: SearchByCreatedTimeOption,
) {
  executeFn({
    targetKey: 'byCreatedTime',
    searchRunner: (prev) => {
      const prevLast = getLastElement(prev.resultsList);
      return searchRoomsByCreatedTime(
        option.db,
        prevLast
          ? {
              time: prevLast.createdTime,
              key: prevLast.roomId,
            }
          : undefined,
      );
    },
    descending: true,
  });
}
