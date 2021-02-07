import { RTDB_KEY_PASSWORD, DbAndRequestingPath } from '../rtdb/constants';
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

export interface RequestingBaseOption extends DbAndRequestingPath {}

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
