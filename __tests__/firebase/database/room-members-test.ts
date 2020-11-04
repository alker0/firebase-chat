import { sampleOfTalker } from './sample-data-creator';
import {
  getOnceVal,
  discardOnceVal,
  updateOnRoot,
  assertAllSuccessLazy,
  logNonPermDenied,
} from './rules-test-utils';
import {
  adminDb,
  anonymousDb,
  anonymousUid,
  anotherDb,
  anotherUid,
  cleanup,
  dependsMap,
  getOnlyRequestUid,
  roomEntranceRoot,
  roomMembersInfoRoot,
  sampleData,
  serverValue,
  setUpDb,
  userContext,
  userDb,
} from './test-setup-talker';

// eslint-disable-next-line jest/no-export
export function roomMembersTest() {
  describe('room members test', () => {
    beforeAll(async () => {});
    afterAll(async () => {
      await cleanup();
      console.log('creaned up');
    });
    describe('entry request test', () => {
      let endTest = () => {};
      let requestable = false;
      beforeAll(async () => {
        await dependsMap.roomCreatable.promise;
        const [settingUp, endTesting] = await setUpDb();
        endTest = endTesting;
        await settingUp;
        await Promise.all([
          updateOnRoot(userDb, sampleData.roomOfUser, logNonPermDenied),
          updateOnRoot(anotherDb, sampleData.roomOfAnother, logNonPermDenied),
        ]);
      });
      afterAll(() => {
        dependsMap.requestable.send(requestable);
        endTest();
      });
      const requestingPath = `room_members_info/${userContext.roomId}/requesting`;
      const passwordPath = `${requestingPath}/password`;
      const anonymousRequestingPath = `${requestingPath}/${anonymousUid}`;
      it('should show anyone empty password', async () => {
        expect.assertions(2);
        const emptyPassword = '';
        await userDb.ref(passwordPath).set(emptyPassword);
        const reading = getOnceVal(
          anonymousDb.ref(requestingPath).orderByKey().equalTo('password'),
        ).then((requestingInfo) => requestingInfo.password);
        await expect(reading).resolves.toBe(emptyPassword);
        await expect(
          anonymousDb.ref(anonymousRequestingPath).set({
            password: await reading,
          }),
        ).not.toBePermissionDenied();
        await adminDb.ref(anonymousRequestingPath).remove();
      });
      it('should not show non-member users present password', async () => {
        expect.assertions(1);
        await userDb.ref(passwordPath).set(sampleOfTalker.password);
        await expect(
          discardOnceVal(
            anotherDb.ref(requestingPath).orderByKey().equalTo('password'),
          ),
        ).toBePermissionDenied();
      });
      it('should create matched password request', async () => {
        expect.assertions(1);
        const usedPassword = sampleOfTalker.password;
        await userDb.ref(passwordPath).set(usedPassword);
        await expect(
          anonymousDb.ref(`${requestingPath}/${anonymousUid}`).set({
            password: usedPassword,
          }),
        ).not.toBePermissionDenied();
        requestable = true;
      });
      it('should not create unmatched password request', async () => {
        expect.assertions(1);
        const usedPassword = sampleOfTalker.password;
        await userDb.ref(passwordPath).set(usedPassword);
        await expect(
          anotherDb.ref(`${requestingPath}/${anotherUid}`).set({
            password: 'unmatched password',
          }),
        ).toBePermissionDenied();
      });
    });
    describe('request acceptance and denial test', () => {
      beforeAll(() => dependsMap.requestable.promise);
      const userRoomId = userContext.roomId;
      const membersInfoPath = `${roomMembersInfoRoot}/${userRoomId}`;
      const requestingPath = `${membersInfoPath}/requesting`;
      const acceptedPath = `${membersInfoPath}/accepted`;
      const deniedPath = `${membersInfoPath}/denied`;
      const passwordPath = `${requestingPath}/password`;
      const anotherRequestingPath = `${requestingPath}/${anotherUid}`;
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

      it('should accept a requesting user', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setUpDb();
        try {
          await settingUp;
          await setUpUntilItCreateRequestData();
          const requestsForUser = await getOnceVal(userDb.ref(requestingPath));
          const requestKey = getOnlyRequestUid(requestsForUser)[0];
          const acceptanceData = {
            [`${requestingPath}/${requestKey}`]: null,
            [`${acceptedPath}/${requestKey}`]: false,
          };
          await expect(
            updateOnRoot(userDb, acceptanceData, logNonPermDenied),
          ).not.toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('should not accept user who did not request', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setUpDb();
        try {
          await settingUp;
          const acceptanceData = {
            [`${requestingPath}/${anotherUid}`]: null,
            [`${acceptedPath}/${anotherUid}`]: false,
          };
          await expect(
            updateOnRoot(userDb, acceptanceData, logNonPermDenied),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it("should not accept a other's room requesting user", async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setUpDb();
        try {
          await settingUp;
          await setUpUntilItCreateRequestData();
          const requestsForUser = await getOnceVal(userDb.ref(requestingPath));
          const requestKey = getOnlyRequestUid(requestsForUser)[0];
          const acceptanceData = {
            [`${requestingPath}/${requestKey}`]: null,
            [`${acceptedPath}/${requestKey}`]: false,
          };
          await expect(
            updateOnRoot(anotherDb, acceptanceData, logNonPermDenied),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it("should deny user's request", async () => {
        expect.assertions(2);
        const [settingUp, endTest] = await setUpDb();
        try {
          await settingUp;
          await updateOnRoot(userDb, sampleData.roomOfUser, logNonPermDenied);
          const usedPassword = sampleOfTalker.password;
          await userDb.ref(passwordPath).set(usedPassword);
          await expect(
            userDb.ref(`${deniedPath}/${anotherUid}`).set(false),
          ).not.toBePermissionDenied();
          await expect(
            anotherDb.ref(anotherRequestingPath).set({
              password: usedPassword,
            }),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('should not create primitive data to accepted and denied path', async () => {
        expect.assertions(6);
        const [settingUp, endTest] = await setUpDb();
        try {
          await settingUp;
          await setUpUntilItCreateRequestData();
          const requestsForUser = await getOnceVal(userDb.ref(requestingPath));
          const requestKey = getOnlyRequestUid(requestsForUser)[0];
          const requestingWithKeyPath = `${requestingPath}/${requestKey}`;
          const primitiveAcceptanceData = [false, 1, requestKey].map(
            (primitiveValue) => ({
              [requestingWithKeyPath]: null,
              [acceptedPath]: primitiveValue,
            }),
          );
          const primitiveDeniedData = [false, 0, ''].map((primitiveValue) => ({
            [deniedPath]: primitiveValue,
          }));
          await assertAllSuccessLazy(
            ...[
              ...primitiveAcceptanceData,
              ...primitiveDeniedData,
            ].map((primitiveData) =>
              expect(
                updateOnRoot(userDb, primitiveData, logNonPermDenied),
              ).toBePermissionDenied(),
            ),
          );
        } finally {
          endTest();
        }
      });
      it('should not increase members_count by owner', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setUpDb();
        try {
          await settingUp;
          await setUpUntilItCreateAcceptanceData();
          await expect(
            updateOnRoot(
              userDb,
              { [membersCountPath]: serverValue.increment(1) },
              logNonPermDenied,
            ),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('should increase members_count by accepted user with entering', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setUpDb();
        try {
          await settingUp;
          const requestKey = await setUpUntilItCreateAcceptanceData();
          await expect(
            updateOnRoot(
              anonymousDb,
              {
                [membersCountPath]: serverValue.increment(1),
                [`${acceptedPath}/${requestKey}`]: true,
              },
              logNonPermDenied,
            ),
          ).not.toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('should not increase members_count by accepted user without entering', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setUpDb();
        try {
          await settingUp;
          await setUpUntilItCreateAcceptanceData();
          await expect(
            updateOnRoot(
              anonymousDb,
              { [membersCountPath]: serverValue.increment(1) },
              logNonPermDenied,
            ),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('should not enter user without incrememt members_count', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setUpDb();
        try {
          await settingUp;
          const requestKey = await setUpUntilItCreateAcceptanceData();
          await expect(
            updateOnRoot(
              anonymousDb,
              {
                [`${acceptedPath}/${requestKey}`]: true,
              },
              logNonPermDenied,
            ),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('should not enter denied user', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setUpDb();
        try {
          await settingUp;
          const requestKey = await setUpUntilItCreateAcceptanceData();
          await userDb.ref(`${deniedPath}/${anonymousUid}`).set(false);
          await expect(
            updateOnRoot(
              anonymousDb,
              {
                [membersCountPath]: serverValue.increment(1),
                [`${acceptedPath}/${requestKey}`]: true,
              },
              logNonPermDenied,
            ),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
    });
  });
}
