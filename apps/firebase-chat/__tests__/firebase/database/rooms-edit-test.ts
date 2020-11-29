import {
  updateOnRoot,
  assertAllSuccessLazy,
  getDateWithOffset,
} from './rules-test-utils';
import {
  adminDb,
  anonymousDb,
  anotherContext,
  anotherDb,
  anotherUid,
  clearDb,
  fixInfoParts,
  onlyPassDb,
  roomMembersInfoRoot,
  sampleData,
  sampleOfUser,
  sampleValueOfTalker,
  setUpDb,
  userContext,
  userDb,
} from './test-setup-talker';

// eslint-disable-next-line jest/no-export
export function roomsEditTest() {
  describe('rooms edit test', () => {
    describe('create room test', () => {
      it('should create valid room', async () => {
        expect.assertions(2);
        const [settingUp, endTest] = await setUpDb();
        try {
          await settingUp;
          await assertAllSuccessLazy(
            expect(
              updateOnRoot(userDb, sampleData.roomOfUser),
            ).not.toBePermissionDenied(),
            expect(
              updateOnRoot(anotherDb, sampleData.roomOfAnother),
            ).not.toBePermissionDenied(),
          );
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
            updateOnRoot(userDb, sampleData.emptyPassword),
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
              updateOnRoot(onlyPassDb, sampleData.roomOfOnlyPass),
            ).toBePermissionDenied(),
            expect(
              updateOnRoot(anonymousDb, sampleData.roomOfAnonymous),
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
            updateOnRoot(userDb, sampleData.roomOfAnonymous),
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
              updateOnRoot(userDb, sampleData.withOutEntranceOfUser),
            ).toBePermissionDenied(),
            expect(
              updateOnRoot(anotherDb, sampleData.withOutOwnRoomsInfoOfAnother),
            ).toBePermissionDenied(),
            expect(
              updateOnRoot(anotherDb, sampleData.withOutPasswordOfUser),
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
            updateOnRoot(userDb, sampleData.roomCreatedAtFuture),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('shoult not create empty name room', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setUpDb();
        try {
          await settingUp;
          await expect(
            updateOnRoot(userDb, sampleData.emptyRoomName),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('shoult create room its name length is less than 20', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setUpDb();
        try {
          await settingUp;
          await expect(
            updateOnRoot(userDb, sampleData.maxLengthRoomName),
          ).not.toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('shoult not create too long name room', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setUpDb();
        try {
          await settingUp;
          await expect(
            updateOnRoot(userDb, sampleData.tooLongRoomName),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('shoult create room its password length is less than 20', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setUpDb();
        try {
          await settingUp;
          await expect(
            updateOnRoot(userDb, sampleData.maxLengthPassword),
          ).not.toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('shoult not create too long password room', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setUpDb();
        try {
          await settingUp;
          await expect(
            updateOnRoot(userDb, sampleData.tooLongPassword),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
    });
    describe('modify room info test', () => {
      const setupForModifyTest = () =>
        setUpDb({
          initializer: async () => {
            await clearDb();
            await updateOnRoot(adminDb, sampleData.roomOfUser);
          },
        });
      const entrancePath = sampleOfUser.rootKeyMap['key-room_entrances'];
      const roomNamePath = `${entrancePath}/room_name`;
      it('should not modify room_id in public_info', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setupForModifyTest();
        try {
          await settingUp;
          const publicRoomIdPath = `${sampleOfUser.rootKeyMap['key-rooms/public_info']}/room_id`;
          await expect(
            updateOnRoot(userDb, {
              [publicRoomIdPath]: anotherContext.roomId,
            }),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('should modify room_name in own room_entrances', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setupForModifyTest();
        try {
          await settingUp;
          await expect(
            updateOnRoot(userDb, {
              [roomNamePath]: 'modified-name',
            }),
          ).not.toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it("should not modify room_name in other's room_entrances", async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setupForModifyTest();
        try {
          await settingUp;
          await updateOnRoot(adminDb, sampleData.roomOfAnother);
          await expect(
            updateOnRoot(anotherDb, {
              [roomNamePath]: 'modified-name',
            }),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('should not modify owner_id, own_room_id, and created_at in room_entrances', async () => {
        expect.assertions(3);
        const [settingUp, endTest] = await setupForModifyTest();
        try {
          await settingUp;
          await assertAllSuccessLazy(
            expect(
              updateOnRoot(userDb, {
                [`${entrancePath}/owner_id`]: anotherUid,
              }),
            ).toBePermissionDenied(),
            expect(
              updateOnRoot(userDb, {
                [`${entrancePath}/own_room_id`]: sampleValueOfTalker.ownRoomIdMax,
              }),
            ).toBePermissionDenied(),
            expect(
              updateOnRoot(userDb, {
                [`${entrancePath}/created_at`]: getDateWithOffset({
                  minute: -1,
                }),
              }),
            ).toBePermissionDenied(),
          );
        } finally {
          endTest();
        }
      });
    });
    describe('delete rooms test', () => {
      const setupForDeleteTest = () =>
        setUpDb({
          initializer: async () => {
            await clearDb();
            await updateOnRoot(adminDb, sampleData.roomOfUser);
          },
        });
      it('should delete own room', async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setupForDeleteTest();
        try {
          await settingUp;
          await expect(
            updateOnRoot(userDb, sampleData.deletedOfUser),
          ).not.toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it("should not delete other's room", async () => {
        expect.assertions(1);
        const [settingUp, endTest] = await setupForDeleteTest();
        try {
          await settingUp;
          await expect(
            updateOnRoot(anotherDb, sampleData.deletedOfUser),
          ).toBePermissionDenied();
        } finally {
          endTest();
        }
      });
      it('should not delete room without any one of owner-info, entrance and room-members-info', async () => {
        expect.assertions(4);
        const [settingUp, endTest] = await setupForDeleteTest();
        try {
          await settingUp;
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
