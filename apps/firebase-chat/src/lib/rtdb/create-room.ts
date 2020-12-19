import { FirebaseDb, FirebaseDbServerValue } from '@typings/firebase-sdk';
import { roomEntrances } from './variables';
import { isPermissionDeniedError } from './utils';

export async function createRoomIntoDb(
  db: FirebaseDb,
  dbServerValues: FirebaseDbServerValue,
  uid: string,
  roomName: string,
  password: string,
  ownRoomId: string,
  roomId: string,
) {
  await new Promise<void>((resolve, reject) => {
    db.ref().update(
      {
        [`rooms/${uid}/${ownRoomId}/public_info`]: {
          room_id: roomId,
        },
        [`${roomEntrances}/${roomId}`]: {
          owner_id: uid,
          own_room_id: String(ownRoomId),
          room_name: roomName,
          members_count: 1,
          created_at: dbServerValues.TIMESTAMP,
        },
        [`room_members_info/${roomId}/requesting/password`]: password,
      },
      (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      },
    );
  });
}

export async function createRoomWithRetry(
  createRunner: (ownRoomId: string) => Promise<void>,
  maxOwnRoomCount: number,
) {
  let succeeded = false;
  let ownRoomId = 1;
  for (; ownRoomId <= maxOwnRoomCount; ownRoomId += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await createRunner(String(ownRoomId));

      succeeded = true;

      break;
    } catch (error) {
      if (!isPermissionDeniedError(error)) throw error;
    }
  }
  return {
    succeeded,
    ownRoomId: String(ownRoomId),
  };
}

export async function ownRoomsIsFilled(
  db: FirebaseDb,
  uid: string,
  maxRoomCount: number,
) {
  return db
    .ref(roomEntrances)
    .orderByChild('owner_id')
    .equalTo(uid)
    .once('value')
    .then((snapshot) => maxRoomCount <= snapshot.numChildren());
}
