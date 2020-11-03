/* eslint-disable jest/no-disabled-tests */

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
  onlyPassDb,
  sampleData,
  setUpDb,
  userContext,
  userDb,
} from './test-setup-talker';

describe('firebase-database-test', () => {
  afterAll(cleanup);
  describe('create room test', () => {
    let creatable = false;
    afterAll(() => {
      dependsMap.roomCreatable.send(creatable);
    });
    it('should create valid room', async () => {
      expect.assertions(2);
      const [settingUp, endTest] = await setUpDb();
      try {
        await settingUp;
        console.log(sampleData.roomOfUser);
        await assertAllSuccessLazy(
          expect(
            updateOnRoot(userDb, sampleData.roomOfUser, logNonPermDenied),
          ).not.toBePermissionDenied(),
          expect(
            updateOnRoot(anotherDb, sampleData.roomOfAnother, logNonPermDenied),
          ).not.toBePermissionDenied(),
        );
        creatable = true;
      } finally {
        endTest();
      }
    });
    it('should create empty password room', async () => {
      expect.assertions(1);
      const [settingUp, endTest] = await setUpDb();
      try {
        await settingUp;
        await expect(
          updateOnRoot(userDb, sampleData.emptyPassword, logNonPermDenied),
        ).not.toBePermissionDenied();
      } finally {
        endTest();
      }
    });
    it("should not create not email verified user's room", async () => {
      expect.assertions(2);
      const [settingUp, endTest] = await setUpDb();
      try {
        await settingUp;
        await assertAllSuccessLazy(
          expect(
            updateOnRoot(
              onlyPassDb,
              sampleData.roomOfOnlyPass,
              logNonPermDenied,
            ),
          ).toBePermissionDenied(),
          expect(
            updateOnRoot(
              anonymousDb,
              sampleData.roomOfAnonymous,
              logNonPermDenied,
            ),
          ).toBePermissionDenied(),
        );
      } finally {
        endTest();
      }
    });
    it("should not create other user's room and entrance", async () => {
      expect.assertions(1);
      const [settingUp, endTest] = await setUpDb();
      try {
        await settingUp;
        await expect(
          updateOnRoot(userDb, sampleData.roomOfAnonymous, logNonPermDenied),
        ).toBePermissionDenied();
      } finally {
        endTest();
      }
    });
    it('should not create room not has all necessary info', async () => {
      expect.assertions(3);
      const [settingUp, endTest] = await setUpDb();
      try {
        await settingUp;
        await assertAllSuccessLazy(
          expect(
            updateOnRoot(
              userDb,
              sampleData.withOutEntranceOfUser,
              logNonPermDenied,
            ),
          ).toBePermissionDenied(),
          expect(
            updateOnRoot(
              anotherDb,
              sampleData.withOutOwnRoomsInfoOfAnother,
              logNonPermDenied,
            ),
          ).toBePermissionDenied(),
          expect(
            updateOnRoot(
              anotherDb,
              sampleData.withOutPasswordOfUser,
              logNonPermDenied,
            ),
          ).toBePermissionDenied(),
        );
      } finally {
        endTest();
      }
    });

    it("should not create not future 'created_at' data", async () => {
      expect.assertions(1);
      const [settingUp, endTest] = await setUpDb();
      try {
        await settingUp;
        await expect(
          updateOnRoot(
            userDb,
            sampleData.roomCreatedAtFuture,
            logNonPermDenied,
          ),
        ).toBePermissionDenied();
      } finally {
        endTest();
      }
    });
  });
  describe('entry request test', () => {
    let endTest = () => {};
    let requestable = false;
    beforeAll(async () => {
      const [settingUp, endTesting] = await setUpDb();
      endTest = endTesting;
      await settingUp;
      await dependsMap.roomCreatable.promise;
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
  describe('request acceptance test', () => {
    beforeAll(() => dependsMap.requestable.promise);
    const membersInfoPath = `room_members_info/${userContext.roomId}`;
    const requestingPath = `${membersInfoPath}/requesting`;
    const acceptedPath = `${membersInfoPath}/accepted`;
    const passwordPath = `${requestingPath}/password`;
    const anonymousRequestingPath = `${requestingPath}/${anonymousUid}`;
    it('should accept a requesting user', async () => {
      expect.assertions(1);
      const [settingUp, endTest] = await setUpDb();
      try {
        await settingUp;
        await updateOnRoot(userDb, sampleData.roomOfUser, logNonPermDenied);
        const usedPassword = sampleOfTalker.password;
        await userDb.ref(passwordPath).set(usedPassword);
        await anonymousDb.ref(anonymousRequestingPath).set({
          password: usedPassword,
        });
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
    it('should not create primitive data to accepted path', async () => {
      expect.assertions(3);
      const [settingUp, endTest] = await setUpDb();
      try {
        await settingUp;
        await updateOnRoot(userDb, sampleData.roomOfUser, logNonPermDenied);
        const usedPassword = sampleOfTalker.password;
        await userDb.ref(passwordPath).set(usedPassword);
        await anonymousDb.ref(anonymousRequestingPath).set({
          password: usedPassword,
        });
        const requestsForUser = await getOnceVal(userDb.ref(requestingPath));
        const requestKey = getOnlyRequestUid(requestsForUser)[0];
        const requestingWithKeyPath = `${requestingPath}/${requestKey}`;
        const acceptanceData = {
          asBoolean: {
            [requestingWithKeyPath]: null,
            [acceptedPath]: false,
          },
          asNumber: {
            [requestingWithKeyPath]: null,
            [acceptedPath]: 1,
          },
          asString: {
            [requestingWithKeyPath]: null,
            [acceptedPath]: requestKey,
          },
        };
        await assertAllSuccessLazy(
          expect(
            updateOnRoot(userDb, acceptanceData.asBoolean, logNonPermDenied),
          ).toBePermissionDenied(),
          expect(
            updateOnRoot(userDb, acceptanceData.asNumber, logNonPermDenied),
          ).toBePermissionDenied(),
          expect(
            updateOnRoot(userDb, acceptanceData.asString, logNonPermDenied),
          ).toBePermissionDenied(),
        );
      } finally {
        endTest();
      }
    });
    it.todo('should not increase members_count by owner');
    it.todo('should increase members_count by accepted user with entering');
    it.todo(
      'should not increase members_count by accepted user without entering',
    );
    it.todo('should not enter user without incrememt members_count');
    it.todo('should not enter denied user');
    it.todo('should not accept user who did not request');
  });
  describe('delete room test', () => {
    beforeAll(() => dependsMap.roomCreatable.promise);
    it('should delete own room, entrance and password', async () => {
      expect.assertions(1);
      const [settingUp, endTest] = await setUpDb();
      try {
        await settingUp;
        await updateOnRoot(userDb, sampleData.roomOfUser, logNonPermDenied);
        await expect(
          updateOnRoot(userDb, sampleData.deletedOfUser, logNonPermDenied),
        ).not.toBePermissionDenied();
      } finally {
        endTest();
      }
    });
    it("should not delete other user's room and entrance", async () => {
      expect.assertions(1);
      const [settingUp, endTest] = await setUpDb();
      try {
        await settingUp;
        await updateOnRoot(userDb, sampleData.roomOfUser, logNonPermDenied);
        await expect(
          updateOnRoot(anotherDb, sampleData.deletedOfUser, logNonPermDenied),
        ).toBePermissionDenied();
      } finally {
        endTest();
      }
    });
    it('should not delete only one of the room and entrance data', async () => {
      expect.assertions(2);
      const [settingUp, endTest] = await setUpDb();
      try {
        await settingUp;
        await Promise.all([
          updateOnRoot(userDb, sampleData.roomOfUser, logNonPermDenied),
          updateOnRoot(anotherDb, sampleData.roomOfAnother, logNonPermDenied),
        ]);
        await assertAllSuccessLazy(
          expect(
            updateOnRoot(
              userDb,
              sampleData.withOutEntranceOfUser,
              logNonPermDenied,
            ),
          ).toBePermissionDenied(),
          expect(
            updateOnRoot(
              anotherDb,
              sampleData.withOutOwnRoomsInfoOfAnother,
              logNonPermDenied,
            ),
          ).toBePermissionDenied(),
        );
      } finally {
        endTest();
      }
    });
  });
  describe('read inside data on room test', () => {
    beforeAll(() => dependsMap.roomCreatable.promise);
    it.todo('should show accepted user public_info');
    it.todo('should not show not accepted user public_info');
  });
  describe('search rooms test', () => {
    beforeAll(() => dependsMap.roomCreatable.promise);
    it.todo('should search rooms order by created time');
    it.todo('should show searched rooms info');
  });
});
