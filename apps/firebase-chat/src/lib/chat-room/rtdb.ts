import {
  RTDB_KEY_PASSWORD,
  RTDB_KEY_ROOM_ENTRANCES,
  RequestingDataSchema,
} from '../rtdb/constants';
import {
  isPermissionDeniedError,
  getOnceValue,
  DbAndRequestingPath,
  SnapshotWatchOption,
  createDbFirstPromiseAndListener,
} from '../rtdb/utils';
import { FirebaseDb } from '../../typings/firebase-sdk';

export function getAndWatchOwnRoomInternal({
  db,
  internalInfoPath,
  watchOption,
}: {
  db: FirebaseDb;
  internalInfoPath: string;
  watchOption?: SnapshotWatchOption;
}) {
  const targetRef = db.ref(internalInfoPath);

  return createDbFirstPromiseAndListener(targetRef, 'value', watchOption);
}

export function getAndWatchRoomInternalPublic({
  db,
  internalPublicPath,
  watchOption,
}: {
  db: FirebaseDb;
  internalPublicPath: string;
  watchOption?: SnapshotWatchOption;
}) {
  const targetRef = db.ref(internalPublicPath);

  return createDbFirstPromiseAndListener(targetRef, 'value', watchOption);
}

export function getAndWatchRoomEntranceById(
  db: FirebaseDb,
  roomId: string,
  watchOption?: SnapshotWatchOption,
) {
  const targetRef = db
    .ref(`${RTDB_KEY_ROOM_ENTRANCES}`)
    .orderByKey()
    .equalTo(roomId)
    .limitToFirst(1);

  return createDbFirstPromiseAndListener(targetRef, 'value', watchOption);
}

export interface AcceptingBaseOption extends DbAndRequestingPath {
  acceptedPath: string;
}

export function createAcceptanceDataCreator({
  requestingPath,
  acceptedPath,
}: Omit<AcceptingBaseOption, 'db'>) {
  return (targetUid: string) => ({
    [`${requestingPath}/${targetUid}`]: null,
    [`${acceptedPath}/${targetUid}`]: false,
  });
}

async function acceptUserRunner(db: FirebaseDb, acceptanceData: object) {
  await db.ref().update(acceptanceData);

  return true as const;
}

export async function acceptUser(
  option: AcceptingBaseOption & {
    targetUid: string;
  },
): Promise<boolean> {
  const { db, targetUid } = option;

  const createAcceptanceData = createAcceptanceDataCreator(option);

  const acceptanceData = createAcceptanceData(targetUid);

  console.log(acceptanceData);

  try {
    return await acceptUserRunner(db, acceptanceData);
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      console.error(error);
    }
    return false;
  }
}

export function getOnlyRequestUid(target: RequestingDataSchema) {
  return Object.keys(target).filter((key) => key !== RTDB_KEY_PASSWORD);
}

export interface GetRequestingKeysOption extends DbAndRequestingPath {}

export async function getRequestingKeys({
  db,
  requestingPath,
}: GetRequestingKeysOption) {
  const requestsForUser = await getOnceValue<RequestingDataSchema>(
    db.ref(requestingPath),
  );

  return getOnlyRequestUid(requestsForUser);
}

export async function acceptAllUsers(
  option: AcceptingBaseOption,
): Promise<string[] | null> {
  const { requestingPath, acceptedPath } = option;
  try {
    const requestKeys = await getRequestingKeys(option);

    const acceptanceData = requestKeys.reduce(
      (prev, requestKey) =>
        Object.assign(prev, {
          [`${requestingPath}/${requestKey}`]: null,
          [`${acceptedPath}/${requestKey}`]: false,
        }),
      {} as Record<string, false>,
    );

    console.log(acceptanceData);

    return (await acceptUserRunner(option.db, acceptanceData)) && requestKeys;
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      console.error(error);
    }
    return null;
  }
}

export function acceptUsersAuto(option: AcceptingBaseOption) {
  const { db, requestingPath } = option;

  const createAcceptanceData = createAcceptanceDataCreator(option);

  try {
    const handler = db
      .ref(`${requestingPath}`)
      .on('child_added', (childSnapshot) => {
        const childKey = childSnapshot.key;
        if (childKey) {
          if (childKey !== RTDB_KEY_PASSWORD) {
            const acceptanceData = createAcceptanceData(childKey);

            console.log('[acceptUserAuto]Target data', acceptanceData);

            acceptUserRunner(db, acceptanceData).then(() =>
              console.log('[acceptUserAuto]Accepted', childKey),
            );
          }
        } else {
          console.error('[acceptUsersAuto]Snapshot does not have a key');
        }
      });
    return function removeListener() {
      db.ref(requestingPath).off('child_added', handler);
    };
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      console.error(error);
    }
    return null;
  }
}

export interface KickOutOption {
  db: FirebaseDb;
  membersCountPath: string;
  acceptedPath: string;
}

export async function kickAllUsersOut({
  db,
  membersCountPath,
  acceptedPath,
}: KickOutOption) {
  try {
    const acceptedSnapshot = await db.ref(acceptedPath).once('value');
    const kickOutData: Record<string, 1 | null> = {
      [membersCountPath]: 1,
    };
    if (acceptedSnapshot.hasChildren()) {
      acceptedSnapshot.forEach((childSnapthot) => {
        kickOutData[childSnapthot.key!] = null;
      });
    }
    await db.ref().update(kickOutData);
    return true;
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      console.error(error);
    }
    return false;
  }
}
