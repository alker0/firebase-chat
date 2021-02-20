import {
  searchRoomsByName,
  searchRoomsByMembersCount,
  searchRoomsByCreatedTime,
  ResultsInfoBase,
  executeSearchRooms,
} from './rtdb';
import {
  RTDB_KEY_CREATED_AT,
  RTDB_KEY_ROOM_MEMBERS_COUNT,
  RTDB_KEY_OWNER_ID,
  RTDB_KEY_OWN_ROOM_ID,
  RTDB_KEY_ROOM_NAME,
} from '../rtdb/constants';
import {
  arrayFromSnapshot as arrayFromSnapshotUtil,
  RoomEntranceInfo,
} from '../rtdb/utils';
import { getLastElement } from '../common-utils';
import { logger } from '../logger';
import {
  FirebaseAuth,
  FirebaseDb,
  FirebaseDbSnapshot,
} from '../../typings/firebase-sdk';

// export type SearchResultsKey = `by${'Name' | 'MembersCount' | 'CreatedTime'}`;
export type SearchResultsKey = 'byName' | 'byMembersCount' | 'byCreatedTime';

export interface RoomRow extends Omit<RoomEntranceInfo, 'roomId'> {
  roomId: string | null;
}

export interface ResultsInfo extends ResultsInfoBase<RoomRow> {}

export interface SearchBaseOption {
  auth: FirebaseAuth;
  getRequestedPage: () => number;
  getRefreshPromise: () => Promise<ResultsInfo>;
  getPreviousResults: (targetKey: SearchResultsKey) => ResultsInfo;
  resultHandleFn: (
    targetKey: SearchResultsKey,
    resultInfoPromise: () => Promise<ResultsInfo>,
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
        ownerId: dataValues[RTDB_KEY_OWNER_ID],
        ownRoomId: dataValues[RTDB_KEY_OWN_ROOM_ID],
        roomName: dataValues[RTDB_KEY_ROOM_NAME],
        membersCount: dataValues[RTDB_KEY_ROOM_MEMBERS_COUNT],
        createdTime: dataValues[RTDB_KEY_CREATED_AT],
      };
    },
    {
      descending,
    },
  );
}

export interface ExecuteSearchFunction {
  (executeArg: ExecuteSearchOption): void;
}

export function createExecuteSearchFn(
  searchOption: SearchBaseOption,
): ExecuteSearchFunction {
  return async function executeSearch(executeArg: ExecuteSearchOption) {
    const {
      auth,
      getRequestedPage,
      getPreviousResults,
      resultHandleFn,
      getRefreshPromise,
    } = searchOption;
    const requestedPage = getRequestedPage();

    const prevResults = getPreviousResults(executeArg.targetKey);

    logger.logMultiLinesFn({ prefix: 'Search Page Number' }, () => [
      ['Requested Page', requestedPage],
      ['Already Loaded Page', prevResults.pageCount],
    ]);

    if (!auth.currentUser) {
      await auth.signInAnonymously();
    }

    executeSearchRooms({
      targetPage: requestedPage,
      previous: prevResults,
      searchRunner: async (prev) =>
        arrayFromSnapshot(
          await executeArg.searchRunner(prev),
          executeArg.descending,
        ),
      resultHandleFn: (searchPromise) => {
        resultHandleFn(executeArg.targetKey, () =>
          Promise.race([
            getRefreshPromise(),
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
  };
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
          const prevLast = getLastElement(prev.resultList);
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
      const prevLast = getLastElement(prev.resultList);
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
      const prevLast = getLastElement(prev.resultList);
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
