import type firebase from 'firebase';
import {
  RTDB_KEY_ROOMS,
  RTDB_KEY_PUBLIC_INFO,
  RTDB_KEY_ACCEPTED,
  RTDB_KEY_DENIED,
  RTDB_KEY_REQUESTING,
  RTDB_KEY_ROOM_ENTRANCES,
  RTDB_KEY_ROOM_MEMBERS_COUNT,
  RTDB_KEY_ROOM_MEMBERS_INFO,
  RoomMembersInfoKey,
} from './constants';
import { logger } from '../logger';
import { FirebaseDb } from '../../typings/firebase-sdk';

export const permDeniedCode = 'PERMISSION_DENIED';
export const permDeniedMsg = 'PERMISSION_DENIED: Permission denied';

interface ErrorWithCode extends Error {
  code: string;
}

export function isErrorWithCode(error: unknown): error is ErrorWithCode {
  return (
    Boolean(error) &&
    typeof error === 'object' &&
    Object.prototype.hasOwnProperty.call(error, 'message') &&
    Object.prototype.hasOwnProperty.call(error, 'code')
  );
}

export function isPermissionDeniedError(
  error: unknown,
): error is ErrorWithCode {
  if (isErrorWithCode(error)) {
    return (
      error.code.replace('-', '_').toUpperCase() === permDeniedCode ||
      error.message.toUpperCase().indexOf(permDeniedCode) >= 0
    );
  } else {
    return false;
  }
}

export function logNonPermissionDeniedError(error: Error | null) {
  if (error) {
    if ((error as ErrorWithCode).code !== permDeniedCode) {
      console.error(error);
    }
  }
}

export type OnceGettable =
  | firebase.database.Reference
  | firebase.database.Query;

export async function getOnceValue<T = any>(reference: OnceGettable) {
  const snapshot = await reference.once('value');
  return snapshot.val() as T;
}

export function getRoomInternalPath(ownerId: string, ownRoomId: string) {
  return `${RTDB_KEY_ROOMS}/${ownerId}/${ownRoomId}`;
}

export function getRoomPublicInfoPath(ownerId: string, ownRoomId: string) {
  return `${RTDB_KEY_ROOMS}/${ownerId}/${ownRoomId}/${RTDB_KEY_PUBLIC_INFO}`;
}

export function getMembersCountPath(roomId: string) {
  return `${RTDB_KEY_ROOM_ENTRANCES}/${roomId}/${RTDB_KEY_ROOM_MEMBERS_COUNT}`;
}

export function getRequestingPath(roomId: string) {
  return `${RTDB_KEY_ROOM_MEMBERS_INFO}/${roomId}/${RTDB_KEY_REQUESTING}`;
}
export function getAcceptedPath(roomId: string) {
  return `${RTDB_KEY_ROOM_MEMBERS_INFO}/${roomId}/${RTDB_KEY_ACCEPTED}`;
}
export function getDeniedPath(roomId: string) {
  return `${RTDB_KEY_ROOM_MEMBERS_INFO}/${roomId}/${RTDB_KEY_DENIED}`;
}

export function getMembersInfoPathOfUser(
  roomId: string,
  uid: string,
): Record<RoomMembersInfoKey, string> {
  const membersInfoPath = `${RTDB_KEY_ROOM_MEMBERS_INFO}/${roomId}`;
  return {
    requesting: `${membersInfoPath}/${RTDB_KEY_REQUESTING}/${uid}`,
    accepted: `${membersInfoPath}/${RTDB_KEY_ACCEPTED}/${uid}`,
    denied: `${membersInfoPath}/${RTDB_KEY_DENIED}/${uid}`,
  };
}

interface Snapshot extends firebase.database.DataSnapshot {}

export interface ArrayFromSnapshotOption {
  descending?: boolean;
  onNoChildren?: () => void;
}

export function arrayFromSnapshot<T>(
  snapshot: Snapshot,
  pickElementFn: (childSnapshot: Snapshot) => T,
  { descending, onNoChildren }: ArrayFromSnapshotOption = {},
) {
  const resultList: T[] = [];
  if (snapshot.hasChildren()) {
    snapshot.forEach((data) => {
      resultList[descending ? 'unshift' : 'push'](pickElementFn(data));
    });
  } else {
    logger.log(
      { prefix: 'Array From Snapshot' },
      'Not Has Children Value',
      snapshot.val(),
    );
    onNoChildren?.();
  }
  return resultList;
}

export interface DbAndRequestingPath {
  db: FirebaseDb;
  requestingPath: string;
}

export interface RoomEntranceInfo {
  roomId: string;
  ownerId: string;
  ownRoomId: string;
  roomName: string;
  membersCount: number;
  createdTime: number;
}
