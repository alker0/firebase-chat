import { FirebaseDb } from '../../typings/firebase-sdk';
import {
  RTDB_KEY_CREATED_AT,
  RTDB_KEY_ROOM_ENTRANCES,
  RTDB_KEY_ROOM_MEMBERS_COUNT,
  RTDB_KEY_ROOM_NAME,
  RTDB_QUERY_COUNT_LIMIT_ENTRANCES,
  RTDB_QUERY_MAX_LIMIT_ROOM_MEMBERS_COUNT,
} from '../rtdb/variables';

export function searchRoomsByName(
  db: FirebaseDb,
  name: string,
  endAtKey?: string | null,
) {
  return db
    .ref(RTDB_KEY_ROOM_ENTRANCES)
    .orderByChild(RTDB_KEY_ROOM_NAME)
    .startAt(name)
    .endAt(`${name}\uf8ff`, endAtKey ?? undefined)
    .limitToFirst(RTDB_QUERY_COUNT_LIMIT_ENTRANCES)
    .once('value');
}

export function searchRoomsByMembersCount(
  db: FirebaseDb,
  endAtInfo?: {
    count: number;
    key: string | null;
  },
) {
  const endAtArg: [number, string | undefined] = endAtInfo
    ? [endAtInfo.count, endAtInfo.key ?? undefined]
    : [RTDB_QUERY_MAX_LIMIT_ROOM_MEMBERS_COUNT, undefined];
  return db
    .ref(RTDB_KEY_ROOM_ENTRANCES)
    .orderByChild(RTDB_KEY_ROOM_MEMBERS_COUNT)
    .startAt(1)
    .endAt(...endAtArg)
    .limitToLast(RTDB_QUERY_COUNT_LIMIT_ENTRANCES)
    .once('value');
}

export function searchRoomsByCreatedTime(
  db: FirebaseDb,
  endAtInfo?: {
    time: number;
    key: string | null;
  },
) {
  const endAtArg: [number, string | undefined] = endAtInfo
    ? [endAtInfo.time, endAtInfo.key ?? undefined]
    : [Date.now(), undefined];
  return db
    .ref(RTDB_KEY_ROOM_ENTRANCES)
    .orderByChild(RTDB_KEY_CREATED_AT)
    .endAt(...endAtArg)
    .limitToLast(RTDB_QUERY_COUNT_LIMIT_ENTRANCES)
    .once('value');
}

export interface ResultsInfoBase<T> {
  pageCount: number;
  resultList: T[];
}

export interface ExecuteSearchOption<T> {
  targetPage: number;
  previous: ResultsInfoBase<T>;
  resultHandleFn: (searchPromise: Promise<ResultsInfoBase<T>>) => void;
  searchRunner: (previous: ResultsInfoBase<T>) => Promise<T[]>;
  skipCondition?: () => boolean;
}

export function executeSearchRooms<T>({
  targetPage,
  previous,
  resultHandleFn,
  searchRunner,
  skipCondition = () => true,
}: ExecuteSearchOption<T>) {
  const isNextPage = previous.pageCount < targetPage;

  if (!isNextPage && skipCondition()) return;

  resultHandleFn(
    searchRunner(previous).then((resultInfo) => ({
      pageCount: targetPage,
      resultList: (isNextPage ? previous.resultList : []).concat(resultInfo),
    })),
  );
}
