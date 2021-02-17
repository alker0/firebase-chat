import { RTDB_KEY_PASSWORD } from '../rtdb/constants';
import {
  isPermissionDeniedError,
  getOnceValue,
  getMembersCountPath,
  getRequestingPath,
  getAcceptedPath,
  DbAndRequestingPath,
} from '../rtdb/utils';
import { DO_NOTHING } from '../common-utils';
import { FirebaseDb, FirebaseDbServerValue } from '../../typings/firebase-sdk';
import { NullablePromise } from '../../typings/common-utils';

export { getMembersCountPath, getRequestingPath, getAcceptedPath };

export interface RequestingBaseOption extends DbAndRequestingPath {}

export interface GetPasswordOption extends DbAndRequestingPath {}

export async function getPassword({
  db,
  requestingPath,
}: GetPasswordOption): NullablePromise<string> {
  try {
    return await getOnceValue(
      db.ref(requestingPath).orderByKey().equalTo(RTDB_KEY_PASSWORD),
    );
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      console.error(error);
    }
    return null;
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

export interface CheckAcceptanceStatusOption {
  db: FirebaseDb;
  acceptedPath: string;
  uid: string;
}

export type AcceptanceStatus = boolean | null;

export async function checkAcceptanceStatus({
  db,
  acceptedPath,
  uid,
}: CheckAcceptanceStatusOption): Promise<AcceptanceStatus> {
  try {
    const acceptanceObject = await getOnceValue<Record<string, boolean>>(
      db.ref(acceptedPath).orderByKey().equalTo(uid),
    );
    return acceptanceObject[uid];
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      console.error(error);
    }
    return null;
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
    const userAcceptedRef = db
      .ref(acceptedPath)
      .orderByKey()
      .equalTo(uid)
      .limitToFirst(1);
    let resolve: (_: boolean) => void = DO_NOTHING;
    let reject = DO_NOTHING;
    const enteringPromise = new Promise<boolean>((resolveFn, rejectFn) => {
      resolve = resolveFn;
      reject = rejectFn;
    });
    const handler = userAcceptedRef.on(
      'child_added',
      async function acceptedHandler(snapshot) {
        const snapshotValue: boolean | null = snapshot.val();
        if (snapshotValue === true) {
          resolve(true);
          userAcceptedRef.off('child_added', acceptedHandler);
        } else if (snapshotValue === false) {
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
    return null;
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
