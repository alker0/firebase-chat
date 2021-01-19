import { FirebaseDb } from '../../typings/firebase-sdk';
import {
  roomEntrances,
  entrancesQueryLimit,
  maxRoomMembersCount,
} from '../rtdb/variables';

export function searchRoomsByName(
  db: FirebaseDb,
  name: string,
  endAtKey?: string | null,
) {
  return db
    .ref(roomEntrances)
    .orderByChild('room_name')
    .startAt(name)
    .endAt(`${name}\uf8ff`, endAtKey ?? undefined)
    .limitToFirst(entrancesQueryLimit)
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
    : [maxRoomMembersCount, undefined];
  return db
    .ref(roomEntrances)
    .orderByChild('members_count')
    .startAt(1)
    .endAt(...endAtArg)
    .limitToLast(entrancesQueryLimit)
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
    .ref(roomEntrances)
    .orderByChild('created_at')
    .endAt(...endAtArg)
    .limitToLast(entrancesQueryLimit)
    .once('value');
}

export interface ResultsInfoBase<T> {
  pageCount: number;
  resultsList: T[];
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
      resultsList: (isNextPage ? previous.resultsList : []).concat(resultInfo),
    })),
  );
}
