import {
  updateOnRoot,
  assertAllSuccessLazy,
  logNonPermDenied,
} from './rules-test-utils';
import {
  anonymousDb,
  anotherDb,
  dependsMap,
  fixInfoParts,
  onlyPassDb,
  roomMembersInfoRoot,
  sampleData,
  sampleOfUser,
  setUpDb,
  userContext,
  userDb,
} from './test-setup-talker';

// eslint-disable-next-line jest/no-export
export function roomsEditTest() {
  describe('rooms edit test', () => {
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
              updateOnRoot(
                anotherDb,
                sampleData.roomOfAnother,
                logNonPermDenied,
              ),
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
    describe('delete rooms test', () => {
      beforeAll(async () => {
        await dependsMap.roomCreatable.promise;
      });
      it('should delete own room', async () => {
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
      it("should not delete other's room", async () => {
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
      it('should not delete room without any one of owner-info, entrance and room-members-info', async () => {
        expect.assertions(4);
        const [settingUp, endTest] = await setUpDb();
        try {
          await settingUp;
          await updateOnRoot(userDb, sampleData.roomOfUser, logNonPermDenied);
          await userDb
            .ref(`${roomMembersInfoRoot}/${userContext.roomId}/denied/foo`)
            .set(false);
          await assertAllSuccessLazy(
            ...[
              fixInfoParts.nonPublicInfo,
              fixInfoParts.nonEntrance,
              fixInfoParts.nonPassword,
              fixInfoParts.nonDenied,
            ].map((fixInfo, removeIndex, allParts) =>
              expect(
                updateOnRoot(
                  userDb,
                  sampleOfUser.createFixed((rootKeyMap) =>
                    [
                      ...allParts.slice(0, removeIndex),
                      ...allParts.slice(removeIndex + 1),
                    ].map((parts) => parts(rootKeyMap)),
                  ),
                  logNonPermDenied,
                ),
              ).toBePermissionDenied(),
            ),
          );
        } finally {
          endTest();
        }
      });
    });
  });
}
