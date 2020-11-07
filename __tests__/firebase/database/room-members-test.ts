import {
  getOnceVal,
  discardOnceVal,
  updateOnRoot,
  assertAllSuccessLazy,
} from './rules-test-utils';
import {
  adminDb,
  anonymousDb,
  anonymousUid,
  anotherDb,
  anotherUid,
  childScheduler,
  getOnlyRequestUid,
  roomMembersInfoRoot,
  sampleData,
  sampleOfUser,
  sampleValueOfTalker,
  serverValue,
  setUpDb,
  userContext,
  userDb,
} from './test-setup-talker';

const userRoomId = userContext.roomId;
const entrancePath = sampleOfUser.rootKeyMap['key-room_entrances'];
const membersInfoPath = `${roomMembersInfoRoot}/${userRoomId}`;
const requestingPath = `${membersInfoPath}/requesting`;
const acceptedPath = `${membersInfoPath}/accepted`;
const deniedPath = `${membersInfoPath}/denied`;
const passwordPath = `${requestingPath}/password`;
const anotherRequestingPath = `${requestingPath}/${anotherUid}`;
const anonymousRequestingPath = `${requestingPath}/${anonymousUid}`;
const anotherAcceptedgPath = `${acceptedPath}/${anotherUid}`;
const anonymousAcceptedPath = `${acceptedPath}/${anonymousUid}`;
const membersCountPath = `${entrancePath}/members_count`;
const validPassword = sampleValueOfTalker.password;

const setupData = {
  request: {
    ...sampleData.roomOfUser,
    [anonymousRequestingPath]: {
      password: validPassword,
    },
  },
  acceptance: {
    ...sampleData.roomOfUser,
    [anonymousAcceptedPath]: false,
  },
  entering: {
    ...sampleData.roomHasTwoMembers,
    [anonymousAcceptedPath]: true,
  },
};

async function clearMembersInfoByAdmin() {
  await adminDb.ref(membersInfoPath).remove();
}

const cleanUpOf = {
  async requestingData() {
    await adminDb.ref(anonymousRequestingPath).remove();
    await updateOnRoot(adminDb, sampleData.roomOfUser);
  },
  async acceptanceData() {
    await clearMembersInfoByAdmin();
    await updateOnRoot(adminDb, setupData.request);
  },
  async deniedData() {
    await clearMembersInfoByAdmin();
    await updateOnRoot(adminDb, sampleData.roomOfUser);
  },
  async enteringData() {
    await clearMembersInfoByAdmin();
    await updateOnRoot(adminDb, setupData.acceptance);
  },
  async exitData() {
    await clearMembersInfoByAdmin();
    await updateOnRoot(adminDb, setupData.entering);
  },
};

async function setPasswordByAdmin(usedPassword: string) {
  await adminDb.ref(passwordPath).set(usedPassword);
}

async function getRequestKeyByAdmin() {
  const requestsForUser = await getOnceVal(adminDb.ref(requestingPath));
  return getOnlyRequestUid(requestsForUser)[0];
}

async function setDeniedDataByAdmin(deniedUid: string) {
  await adminDb.ref(`${deniedPath}/${deniedUid}`).set(false);
}

// eslint-disable-next-line jest/no-export
export function roomMembersTest() {
  describe('room members test', () => {
    describe('entry request test', () => {
      let endTestGroup = () => {};
      beforeAll(async () => {
        const [settingUp, endTestGroupFn] = await setUpDb();
        endTestGroup = endTestGroupFn;
        await settingUp;
        await updateOnRoot(adminDb, {
          ...sampleData.roomOfUser,
          ...sampleData.roomOfAnother,
        });
      });
      afterAll(() => {
        endTestGroup();
      });
      const setupForRequestTest = () =>
        setUpDb({
          scheduler: childScheduler,
          initializer: cleanUpOf.requestingData,
        });
      it('should show anyone empty password', async () => {
        expect.assertions(2);
        const emptyPassword = '';
        const [settingUp, endTest] = await setupForRequestTest();
        try {
          await settingUp;
          await setPasswordByAdmin(emptyPassword);
          const reading = getOnceVal(
            anonymousDb.ref(requestingPath).orderByKey().equalTo('password'),
          ).then((requestingInfo) => requestingInfo.password);
          await expect(reading).resolves.toBe(emptyPassword);
          await expect(
            anonymousDb.ref(anonymousRequestingPath).set({
              password: await reading,
            }),
          ).not.toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('should not show non-member users present password', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setupForRequestTest();
        try {
          await settingUp;
          await setPasswordByAdmin(sampleValueOfTalker.password);
          await expect(
            discardOnceVal(
              anotherDb.ref(requestingPath).orderByKey().equalTo('password'),
            ),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('should create matched password request', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setupForRequestTest();
        try {
          await settingUp;
          const usedPassword = sampleValueOfTalker.password;
          await setPasswordByAdmin(usedPassword);
          await expect(
            anonymousDb.ref(anonymousRequestingPath).set({
              password: usedPassword,
            }),
          ).not.toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('should not create unmatched password request', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setupForRequestTest();
        try {
          await settingUp;
          await setPasswordByAdmin(sampleValueOfTalker.password);
          await expect(
            anotherDb.ref(anonymousRequestingPath).set({
              password: 'unmatched password',
            }),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
    });
    describe('request acceptance and denial test', () => {
      let endTestGroup = () => {};
      beforeAll(async () => {
        const [settingUp, endTestGroupFn] = await setUpDb();
        endTestGroup = endTestGroupFn;
        await settingUp;
        await updateOnRoot(adminDb, setupData.request);
      });
      afterAll(() => {
        endTestGroup();
      });
      const setupForAcceptanceTest = () =>
        setUpDb({
          scheduler: childScheduler,
          initializer: cleanUpOf.acceptanceData,
        });
      it('should accept a requesting user', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setupForAcceptanceTest();
        try {
          await settingUp;
          const requestKey = await getRequestKeyByAdmin();
          const acceptanceData = {
            [`${requestingPath}/${requestKey}`]: null,
            [`${acceptedPath}/${requestKey}`]: false,
          };
          await expect(
            updateOnRoot(userDb, acceptanceData),
          ).not.toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('should not accept user who did not request', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setupForAcceptanceTest();
        try {
          await settingUp;
          const acceptanceData = {
            [anotherRequestingPath]: null,
            [anotherAcceptedgPath]: false,
          };
          await expect(
            updateOnRoot(userDb, acceptanceData),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it("should not show a other's room request data", async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setupForAcceptanceTest();
        try {
          await settingUp;
          await expect(
            discardOnceVal(anotherDb.ref(requestingPath)),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it("should not accept a other's room requesting user", async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setupForAcceptanceTest();
        try {
          await settingUp;
          const requestKey = await getRequestKeyByAdmin();
          const acceptanceData = {
            [`${requestingPath}/${requestKey}`]: null,
            [`${acceptedPath}/${requestKey}`]: false,
          };
          await expect(
            updateOnRoot(anotherDb, acceptanceData),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('should not create primitive data to accepted path', async () => {
        expect.assertions(3);
        const [settingUp, endTest] = await setupForAcceptanceTest();
        try {
          await settingUp;
          const requestKey = await getRequestKeyByAdmin();
          const requestingWithKeyPath = `${requestingPath}/${requestKey}`;
          await assertAllSuccessLazy(
            ...[false, 1, requestKey]
              .map((primitiveValue) => ({
                [requestingWithKeyPath]: null,
                [acceptedPath]: primitiveValue,
              }))
              .map((primitiveData) =>
                expect(
                  updateOnRoot(userDb, primitiveData),
                ).toBePermissionDenied(),
              ),
          );
        } finally {
          endTest();
        }
      });
    });
    describe('request denial test', () => {
      let endTestGroup = () => {};
      beforeAll(async () => {
        const [settingUp, endTestGroupFn] = await setUpDb();
        endTestGroup = endTestGroupFn;
        await settingUp;
        await updateOnRoot(adminDb, sampleData.roomOfUser);
      });
      afterAll(() => {
        endTestGroup();
      });
      const setupForDenialTest = () =>
        setUpDb({
          scheduler: childScheduler,
          initializer: cleanUpOf.requestingData,
        });
      it("should deny user's request", async () => {
        expect.assertions(2);
        const [settingUp, endTest] = await setupForDenialTest();
        try {
          await settingUp;
          const usedPassword = sampleValueOfTalker.password;
          await setPasswordByAdmin(usedPassword);
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
      it('should not create primitive data to denied path', async () => {
        expect.assertions(3);
        const [settingUp, endTest] = await setupForDenialTest();
        try {
          await settingUp;
          await assertAllSuccessLazy(
            ...[false, 0, '']
              .map((primitiveValue) => ({
                [deniedPath]: primitiveValue,
              }))
              .map((primitiveData) =>
                expect(
                  updateOnRoot(userDb, primitiveData),
                ).toBePermissionDenied(),
              ),
          );
        } finally {
          endTest();
        }
      });
    });
    describe('room entering test', () => {
      let endTestGroup = () => {};
      beforeAll(async () => {
        const [settingUp, endTestGroupFn] = await setUpDb();
        endTestGroup = endTestGroupFn;
        await settingUp;
        await updateOnRoot(adminDb, setupData.acceptance);
      });
      afterAll(() => {
        endTestGroup();
      });
      const setupForEnteringTest = () =>
        setUpDb({
          scheduler: childScheduler,
          initializer: cleanUpOf.enteringData,
        });
      it('should increase members_count by accepted user with entering', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setupForEnteringTest();
        try {
          await settingUp;
          await expect(
            updateOnRoot(anonymousDb, {
              [membersCountPath]: serverValue.increment(1),
              [anonymousAcceptedPath]: true,
            }),
          ).not.toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('should not increase members_count by owner', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setupForEnteringTest();
        try {
          await settingUp;
          await expect(
            updateOnRoot(userDb, {
              [membersCountPath]: serverValue.increment(1),
            }),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('should not increase members_count by accepted user without entering', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setupForEnteringTest();
        try {
          await settingUp;
          await expect(
            updateOnRoot(anonymousDb, {
              [membersCountPath]: serverValue.increment(1),
            }),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('should not enter user without incrememt members_count', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setupForEnteringTest();
        try {
          await settingUp;
          await expect(
            updateOnRoot(anonymousDb, {
              [anonymousAcceptedPath]: true,
            }),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('should not enter denied user', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setupForEnteringTest();
        try {
          await settingUp;
          await setDeniedDataByAdmin(anonymousUid);
          await expect(
            updateOnRoot(anonymousDb, {
              [membersCountPath]: serverValue.increment(1),
              [anonymousAcceptedPath]: true,
            }),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
    });
    describe('room exit test', () => {
      let endTestGroup = () => {};
      beforeAll(async () => {
        const [settingUp, endTestGroupFn] = await setUpDb();
        endTestGroup = endTestGroupFn;
        await settingUp;
        await updateOnRoot(adminDb, setupData.entering);
      });
      afterAll(() => {
        endTestGroup();
      });
      const setupForExitTest = () =>
        setUpDb({
          scheduler: childScheduler,
          initializer: cleanUpOf.exitData,
        });
      it('should exit with decrement members_count', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setupForExitTest();
        try {
          await settingUp;
          await expect(
            updateOnRoot(anonymousDb, {
              [membersCountPath]: serverValue.increment(-1),
              [anonymousAcceptedPath]: false,
            }),
          ).not.toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('should not decrement members_count without exit', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setupForExitTest();
        try {
          await settingUp;
          await expect(
            updateOnRoot(anonymousDb, {
              [membersCountPath]: serverValue.increment(-1),
            }),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('should not exit without decrement members_count', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setupForExitTest();
        try {
          await settingUp;
          await expect(
            updateOnRoot(anonymousDb, {
              [anonymousAcceptedPath]: false,
            }),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('should run all members out of own room with reset members_count', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setupForExitTest();
        try {
          await settingUp;
          await expect(
            updateOnRoot(userDb, {
              [membersCountPath]: 1,
              [anonymousAcceptedPath]: null,
            }),
          ).not.toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('should not run all members out of own room without reset members_count', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setupForExitTest();
        try {
          await settingUp;
          await expect(
            updateOnRoot(userDb, {
              [anonymousAcceptedPath]: null,
            }),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
    });
  });
}
