import { getCurrentUserOrSignInAnonymously } from '../solid-firebase-auth';
import {
  checkAcceptanceStatus,
  CheckAcceptanceStatusOption,
  getPassword,
  GetPasswordOption,
  requestRoomEntryPermission,
  enterRoomAuto,
} from './rtdb';
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

export type EnterCondition =
  | 'NeedsPassword'
  | 'NeedsRequest'
  | 'IsAlreadyAccepted'
  | 'IsAlreadyMember';

export interface CheckEnterConditionOption
  extends CheckAcceptanceStatusOption,
    GetPasswordOption {}

export async function checkEnterCondition({
  db,
  requestingPath,
  acceptedPath,
  uid,
}: CheckEnterConditionOption): Promise<EnterCondition> {
  const acceptanceStatus = await checkAcceptanceStatus({
    db,
    acceptedPath,
    uid,
  });
  switch (acceptanceStatus) {
    case true:
      return 'IsAlreadyMember';
    case false:
      return 'IsAlreadyAccepted';
    default:
      if (await getPassword({ db, requestingPath })) {
        return 'NeedsRequest';
      } else {
        return 'NeedsPassword';
      }
  }
}

export interface EnterOption {
  auth: FirebaseAuth;
  targetRoomId: string;
  enterCondition: EnterCondition;
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
  enterCondition,
  targetRoomId,
  inputPassword,
  handleEntering,
}: EnterOption): Promise<EnterResult> {
  if (enterCondition === 'IsAlreadyMember') {
    return 'Succeeded';
  }

  const currentUser = await getCurrentUserOrSignInAnonymously(auth);
  if (currentUser) {
    const { uid } = currentUser;

    const userRequestingPath = `${getRequestingPath(targetRoomId)}/${uid}`;
    const acceptedPath = getAcceptedPath(targetRoomId);

    if (
      enterCondition === 'NeedsPassword' ||
      enterCondition === 'NeedsRequest'
    ) {
      const succeededRequesting = await requestRoomEntryPermission({
        db,
        userRequestingPath,
        password: inputPassword,
      });

      if (!succeededRequesting) {
        return 'FailedOnRequest';
      }
    }

    const autoEnterState = await enterRoomAuto({
      db,
      uid,
      acceptedPath,
      dbServerValue,
      membersCountPath: getMembersCountPath(targetRoomId),
    });

    if (!autoEnterState) {
      return 'FailedOnAutoStart';
    }

    const [enterPromise, removeListener] = autoEnterState;

    handleEntering(removeListener);

    const succeededEntering = await enterPromise;

    if (succeededEntering) {
      return 'Succeeded';
    } else {
      return 'FailedOnEnter';
    }
  } else {
    return 'NeverStarted';
  }
}
