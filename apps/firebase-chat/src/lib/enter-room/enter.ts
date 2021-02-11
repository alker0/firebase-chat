import { getCurrentUserOrSignInAnonymously } from '../solid-firebase-auth';
import { enterRoomAuto, requestRoomEntryPermission } from './rtdb';
import {
  getMembersCountPath,
  getAcceptedPath,
  getRequestingPath,
} from '../rtdb/utils';
import {
  FirebaseAuth,
  FirebaseDb,
  FirebaseDbServerValue,
} from '../../typings/firebase-sdk';

export interface EnterOption {
  auth: FirebaseAuth;
  targetRoomId: string;
  db: FirebaseDb;
  dbServerValue: FirebaseDbServerValue;
  inputPassword: string;
  handleEntering: (removeListener: () => void) => void;
}

export type EnterResult =
  | 'NeverStarted'
  | 'Succeeded'
  | 'FailedOnRequest'
  | 'FailedOnAutoStart'
  | 'FailedOnEnter';

export async function executeEnter({
  auth,
  db,
  dbServerValue,
  targetRoomId,
  inputPassword,
  handleEntering,
}: EnterOption): Promise<EnterResult> {
  const currentUser = await getCurrentUserOrSignInAnonymously(auth);
  if (currentUser) {
    const { uid } = currentUser;

    const userRequestingPath = `${getRequestingPath(targetRoomId)}/${uid}`;
    const acceptedPath = getAcceptedPath(targetRoomId);

    const succeededRequesting = await requestRoomEntryPermission({
      db,
      userRequestingPath,
      password: inputPassword,
    });

    if (!succeededRequesting) {
      return 'FailedOnRequest';
    }

    const autoState = await enterRoomAuto({
      db,
      uid,
      acceptedPath,
      dbServerValue,
      membersCountPath: getMembersCountPath(targetRoomId),
    });

    if (!autoState) {
      return 'FailedOnAutoStart';
    }

    const [entering, removeListener] = autoState;

    handleEntering(removeListener);

    const succeededEntering = await entering;

    if (succeededEntering) {
      return 'Succeeded';
    } else {
      return 'FailedOnEnter';
    }
  } else {
    return 'NeverStarted';
  }
}
