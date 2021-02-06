import { RTDB_KEY_PASSWORD, RequestingDataSchema } from '../rtdb/constants';
import {
  isPermissionDeniedError,
  getOnceValue,
  getMembersCountPath,
  getRequestingPath,
  getAcceptedPath,
} from '../rtdb/utils';
import { DO_NOTHING } from '../common-utils';
import { FirebaseDb, FirebaseDbServerValue } from '../../typings/firebase-sdk';

export { getMembersCountPath, getRequestingPath, getAcceptedPath };

export interface DbAndRequestingPath {
  db: FirebaseDb;
  requestingPath: string;
}

export interface RequestingBaseOption {
  db: FirebaseDb;
  requestingPath: string;
}

interface GetPasswordOption extends DbAndRequestingPath {}

interface GetPasswordResult {
  succeeded: boolean;
  password: string;
}

export async function getPassword({
  db,
  requestingPath,
}: GetPasswordOption): Promise<GetPasswordResult> {
  try {
    return {
      succeeded: true,
      password: await getOnceValue(
        db.ref(requestingPath).orderByKey().equalTo(RTDB_KEY_PASSWORD),
      ),
    };
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      console.error(error);
    }
    return {
      succeeded: false,
      password: '',
    };
  }
}

export interface RequestRoomEntryPermissionOption {
  db: FirebaseDb;
  userRequestingPath: string;
  password: string;
}

export async function requestRoomEntryPermission({
  db,
  userRequestingPath,
  password,
}: RequestRoomEntryPermissionOption): Promise<boolean> {
  try {
    await db.ref(userRequestingPath).set({
      [RTDB_KEY_PASSWORD]: password,
    });
    return true;
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

  return true;
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

export async function acceptAllUsers(
  option: AcceptingBaseOption,
): Promise<boolean> {
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

    return await acceptUserRunner(option.db, acceptanceData);
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      console.error(error);
    }
    return false;
  }
}

export function acceptUsersAuto(option: AcceptingBaseOption) {
  const { db, requestingPath } = option;

  const createAcceptanceData = createAcceptanceDataCreator(option);

  try {
    const handler = db
      .ref(`${requestingPath}`)
      .on('child_added', (childSnapshot) => {
        if (childSnapshot.key) {
          const acceptanceData = createAcceptanceData(childSnapshot.key);

          console.log(acceptanceData);

          acceptUserRunner(db, acceptanceData);
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
    return false;
  }
}

export interface EnterRoomOption {
  db: FirebaseDb;
  dbServerValue: FirebaseDbServerValue;
  membersCountPath: string;
  acceptedPath: string;
  uid: string;
}

export async function enterRoom({
  db,
  dbServerValue,
  membersCountPath,
  acceptedPath,
  uid,
}: EnterRoomOption): Promise<boolean> {
  try {
    await db.ref().update({
      [membersCountPath]: dbServerValue.increment(1),
      [`${acceptedPath}/${uid}`]: true,
    });
    return true;
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      console.error(error);
    }
    return false;
  }
}

export async function enterRoomAuto({
  db,
  dbServerValue,
  membersCountPath,
  acceptedPath,
  uid,
}: EnterRoomOption) {
  try {
    const userAcceptedPath = `${acceptedPath}/${uid}`;
    const userAcceptedRef = db.ref(acceptedPath).orderByKey().equalTo(uid);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let resolve = (_a: boolean) => {};
    let reject = DO_NOTHING;
    const enteringPromise = new Promise<boolean>((resolveFn, rejectFn) => {
      resolve = resolveFn;
      reject = rejectFn;
    });
    const handler = userAcceptedRef.on(
      'child_added',
      async function acceptedHandler(snapshot) {
        if (snapshot.exists()) {
          await db
            .ref()
            .update({
              [membersCountPath]: dbServerValue.increment(1),
              [userAcceptedPath]: true,
            })
            .then(() => resolve(true))
            .catch(reject)
            .finally(() => userAcceptedRef.off('child_added', acceptedHandler));
        }
      },
    );
    return [
      enteringPromise,
      function removeListener() {
        userAcceptedRef.off('child_added', handler);
        resolve(false);
      },
    ] as const;
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      console.error(error);
    }
    return false;
  }
}

export interface ExitRoomOption {
  db: FirebaseDb;
  dbServerValue: FirebaseDbServerValue;
  membersCountPath: string;
  userAcceptedPath: string;
}

export async function exitRoom({
  db,
  dbServerValue,
  membersCountPath,
  userAcceptedPath,
}: ExitRoomOption): Promise<boolean> {
  try {
    await db.ref().update({
      [membersCountPath]: dbServerValue.increment(-1),
      [userAcceptedPath]: false,
    });
    return true;
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      console.error(error);
    }
    return false;
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
