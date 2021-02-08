import {
  RTDB_KEY_PASSWORD,
  RequestingDataSchema,
} from '../rtdb/constants';
import {
  isPermissionDeniedError,
  getOnceValue,
  DbAndRequestingPath,
} from '../rtdb/utils';
import { FirebaseDb } from '../../typings/firebase-sdk';

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
): Promise<false | string[]> {
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
