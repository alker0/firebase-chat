import {
  RTDB_KEY_PASSWORD,
  RTDB_KEY_REQUESTING,
  RTDB_KEY_ROOM_ENTRANCES,
  RTDB_KEY_ROOM_MEMBERS_INFO,
  RTDB_QUERY_COUNT_LIMIT_OWN_ROOMS,
} from '../rtdb/constants';
import { isPermissionDeniedError } from '../rtdb/utils';
import { FirebaseDb, FirebaseDbServerValue } from '../../typings/firebase-sdk';

export function getNewRoomKey(db: FirebaseDb) {
  return db.ref(RTDB_KEY_ROOM_ENTRANCES).push().key!;
}

export interface CreateRoomRunnerArgs {
  db: FirebaseDb;
  dbServerValues: FirebaseDbServerValue;
  uid: string;
  roomName: string;
  password: string;
  ownRoomId: string;
  roomId: string;
}

export function createRoomIntoDb({
  db,
  dbServerValues,
  uid,
  roomName,
  password,
  ownRoomId,
  roomId,
}: CreateRoomRunnerArgs) {
  return db.ref().update({
    [`rooms/${uid}/${ownRoomId}/public_info`]: {
      room_id: roomId,
    },
    [`${RTDB_KEY_ROOM_ENTRANCES}/${roomId}`]: {
      owner_id: uid,
      own_room_id: String(ownRoomId),
      room_name: roomName,
      members_count: 1,
      created_at: dbServerValues.TIMESTAMP,
    },
    [`${RTDB_KEY_ROOM_MEMBERS_INFO}/${roomId}/${RTDB_KEY_REQUESTING}/${RTDB_KEY_PASSWORD}`]: password,
  });
}

export async function createRoomWithRetry(
  createRunner: (ownRoomId: string) => Promise<void>,
  maxOwnRoomCount: number,
) {
  let succeeded = false;
  let ownRoomId = 0;
  let ownRoomIdText = String(ownRoomId);
  for (; ownRoomId < maxOwnRoomCount; ownRoomId += 1) {
    ownRoomIdText = String(ownRoomId);
    try {
      // eslint-disable-next-line no-await-in-loop
      await createRunner(ownRoomIdText);

      succeeded = true;

      break;
    } catch (error) {
      if (!isPermissionDeniedError(error)) throw error;
    }
  }
  return {
    succeeded,
    ownRoomId: ownRoomIdText,
  };
}

export async function ownRoomsIsFilled(db: FirebaseDb, uid: string) {
  const snapshot = await db
    .ref(RTDB_KEY_ROOM_ENTRANCES)
    .orderByChild('owner_id')
    .equalTo(uid)
    .limitToFirst(RTDB_QUERY_COUNT_LIMIT_OWN_ROOMS)
    .once('value');

  return RTDB_QUERY_COUNT_LIMIT_OWN_ROOMS <= snapshot.numChildren();
}
