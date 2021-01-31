import { getMembersCountPath, getMembersInfoPathOfUser } from '../rtdb/utils';
import { enterRoomAuto, requestRoomEntryPermission } from './rtdb';
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
  const currentUser = auth.currentUser ?? (await auth.signInAnonymously()).user;
  if (currentUser) {
    const { uid } = currentUser;

    const {
      requesting: userRequestingPath,
      accepted: acceptedPath,
    } = getMembersInfoPathOfUser(targetRoomId, uid);

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

    // createDebugButton({
    //   text: 'Cancel Entering',
    //   onClick: (_e, remove) => {
    //     cancelFn();
    //     remove();
    //   },
    // });

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
