import {
  getAndWatchOwnRoomInternal,
  getAndWatchRoomInternalPublic,
  getAndWatchRoomEntranceById,
} from './rtdb';
import {
  RTDB_KEY_OWNER_ID,
  RTDB_KEY_OWN_ROOM_ID,
  RTDB_KEY_ROOM_NAME,
  RTDB_KEY_ROOM_MEMBERS_COUNT,
  RTDB_KEY_CREATED_AT,
  RTDB_KEY_PUBLIC_INFO,
  RoomEntranceDataSchema,
  RoomInternalDataSchema,
  RoomInternalPublicDataSchema,
} from '../rtdb/constants';
import {
  getRoomInternalPath,
  getRoomInternalPublicPath,
  RoomEntranceInfo,
  SnapshotWatchOption,
} from '../rtdb/utils';
import { CONSIDER } from '../common-utils';
import { NullablePromise } from '../../typings/common-utils';
import { FirebaseDb, FirebaseDbSnapshot } from '../../typings/firebase-sdk';

export async function getRoomEntranceFromSnapshot(
  roomId: string,
  snapshotPromise: Promise<FirebaseDbSnapshot>,
): NullablePromise<RoomEntranceInfo> {
  const snapshot = await snapshotPromise;

  const targetRoomEntrance = snapshot.child(roomId).val();

  if (targetRoomEntrance) {
    CONSIDER<RoomEntranceDataSchema>(targetRoomEntrance);

    return {
      roomId,
      ownerId: targetRoomEntrance[RTDB_KEY_OWNER_ID],
      ownRoomId: targetRoomEntrance[RTDB_KEY_OWN_ROOM_ID],
      roomName: targetRoomEntrance[RTDB_KEY_ROOM_NAME],
      membersCount: targetRoomEntrance[RTDB_KEY_ROOM_MEMBERS_COUNT],
      createdTime: targetRoomEntrance[RTDB_KEY_CREATED_AT],
    };
  } else {
    return null;
  }
}

export function getAndWatchRoomEntrance(
  db: FirebaseDb,
  roomId: string,
  watchOption?: SnapshotWatchOption,
) {
  const [snapshotPromise, cancelFn] = getAndWatchRoomEntranceById(
    db,
    roomId,
    watchOption,
  );
  return [
    getRoomEntranceFromSnapshot(roomId, snapshotPromise),
    cancelFn,
  ] as const;
}

export interface RoomInternalGetFnOption {
  db: FirebaseDb;
  ownerId: string;
  ownRoomId: string;
}

export type RoomInternalFromSnapthotResult = NullablePromise<RoomInternalDataSchema>;

export type RoomInternalGetFnResult = readonly [
  RoomInternalFromSnapthotResult,
  () => void,
];

export interface RoomInternalGetFn {
  (option: RoomInternalGetFnOption): RoomInternalGetFnResult;
}

export const roomInternalFromSnapshot = {
  async forOwner(
    snapshotPromise: Promise<FirebaseDbSnapshot>,
  ): RoomInternalFromSnapthotResult {
    try {
      const firstSnapshot = await snapshotPromise;
      return firstSnapshot.val() as RoomInternalDataSchema | null;
    } catch (error) {
      console.error(error);
      return null;
    }
  },
  async forMember(
    snapshotPromise: Promise<FirebaseDbSnapshot>,
  ): RoomInternalFromSnapthotResult {
    try {
      const firstSnapshot = await snapshotPromise;
      const internalPublic = firstSnapshot.val() as RoomInternalPublicDataSchema | null;
      if (internalPublic) {
        return {
          [RTDB_KEY_PUBLIC_INFO]: internalPublic,
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  },
} as const;

export function getRoomInternalGetAndWatchFn(
  isOwner: boolean,
  watchOption?: SnapshotWatchOption,
): RoomInternalGetFn {
  if (isOwner) {
    return function getAndWatchRoomInternal({ db, ownerId, ownRoomId }) {
      const [firstSnapshotPromise, cancelFn] = getAndWatchOwnRoomInternal({
        db,
        internalInfoPath: getRoomInternalPath(ownerId, ownRoomId),
        watchOption,
      });

      return [
        roomInternalFromSnapshot.forOwner(firstSnapshotPromise),
        cancelFn,
      ] as const;
    };
  } else {
    return function getAndWatchRoomInternal({ db, ownerId, ownRoomId }) {
      const [firstSnapshotPromise, cancelFn] = getAndWatchRoomInternalPublic({
        db,
        internalPublicPath: getRoomInternalPublicPath(ownerId, ownRoomId),
        watchOption,
      });

      return [
        roomInternalFromSnapshot.forMember(firstSnapshotPromise),
        cancelFn,
      ] as const;
    };
  }
}
