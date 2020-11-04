import {
  updateOnRoot,
  // assertAllSuccessLazy,
  logNonPermDenied,
  getOnceVal,
} from './rules-test-utils';
import { sampleOfTalker } from './sample-data-creator';
import {
  anonymousDb,
  anonymousUid,
  // anotherDb,
  dependsMap,
  // fixInfoParts,
  getOnlyRequestUid,
  // onlyPassDb,
  roomEntranceRoot,
  roomMembersInfoRoot,
  sampleData,
  // sampleOfUser,
  serverValue,
  // setUpDb,
  userContext,
  userDb,
} from './test-setup-talker';

// eslint-disable-next-line jest/no-export
export function roomsQueryTest() {
  const userRoomId = userContext.roomId;
  const membersInfoPath = `${roomMembersInfoRoot}/${userRoomId}`;
  const requestingPath = `${membersInfoPath}/requesting`;
  const acceptedPath = `${membersInfoPath}/accepted`;
  // const deniedPath = `${membersInfoPath}/denied`;
  const passwordPath = `${requestingPath}/password`;
  const anonymousRequestingPath = `${requestingPath}/${anonymousUid}`;
  const membersCountPath = `${roomEntranceRoot}/${userRoomId}/members_count`;

  async function setUpUntilItCreateRequestData() {
    const usedPassword = sampleOfTalker.password;
    await updateOnRoot(userDb, sampleData.roomOfUser, logNonPermDenied);
    await userDb.ref(passwordPath).set(usedPassword);
    await anonymousDb.ref(anonymousRequestingPath).set({
      password: usedPassword,
    });
  }
  async function setUpUntilItCreateAcceptanceData() {
    await setUpUntilItCreateRequestData();
    const requestsForUser = await getOnceVal(userDb.ref(requestingPath));
    const requestKey = getOnlyRequestUid(requestsForUser)[0];
    const acceptanceData = {
      [`${requestingPath}/${requestKey}`]: null,
      [`${acceptedPath}/${requestKey}`]: false,
    };
    await updateOnRoot(userDb, acceptanceData, logNonPermDenied);
    return requestKey;
  }
  async function setUpUntilItCreateUserEnteryData() {
    const requestKey = await setUpUntilItCreateAcceptanceData();
    await updateOnRoot(
      anonymousDb,
      {
        [membersCountPath]: serverValue.increment(1),
        [`${acceptedPath}/${requestKey}`]: true,
      },
      logNonPermDenied,
    );
  }

  describe('rooms query test', () => {
    describe('read inside data on room test', () => {
      beforeAll(() =>
        Promise.all([
          dependsMap.roomCreatable.promise,
          dependsMap.requestable.promise,
        ]),
      );
      it.todo(
        'should show accepted user public_info',
        // , async () => {
        // }
      );
      it.todo(
        'should not show not accepted user public_info',
        // , async () => {
        // }
      );
    });
    describe('search rooms test', () => {
      beforeAll(() =>
        Promise.all([
          dependsMap.roomCreatable.promise,
          dependsMap.requestable.promise,
        ]),
      );
      it.todo('should search rooms order by created time');
      it.todo('should show searched rooms info');
    });
  });
}
