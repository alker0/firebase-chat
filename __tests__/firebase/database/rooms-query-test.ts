import {
  updateOnRoot,
  getOnceVal,
  discardOnceVal,
  assertAllSuccessLazy,
} from './rules-test-utils';
import {
  adminDb,
  anonymousDb,
  anonymousUid,
  anotherDb,
  roomEntranceRoot,
  roomMembersInfoRoot,
  sampleData,
  sampleOfUser,
  sampleValueOfTalker,
  setUpDb,
  userContext,
  userDb,
  userUid,
} from './test-setup-talker';

const userRoomId = userContext.roomId;
const publicInfoPath = sampleOfUser.rootKeyMap['key-rooms/public_info'];
function getAnonymousAcceptedPath(roomId: string) {
  return `${roomMembersInfoRoot}/${roomId}/accepted/${anonymousUid}`;
}
const anonymousAcceptedPath = getAnonymousAcceptedPath(userRoomId!);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const secondAnonymousAcceptedPath = getAnonymousAcceptedPath(
  sampleValueOfTalker.secondRoomIdOfUser!,
);
const membersCountAfterEntering = sampleValueOfTalker.membersCountMin + 1;

const expectedObject = {
  entranceOfUser: {
    owner_id: userUid,
    own_room_id: sampleValueOfTalker.ownRoomIdMin,
    room_name: sampleValueOfTalker.roomName,
    members_count: membersCountAfterEntering,
    created_at: expect.any(Number),
  },
};

const setupData = {
  entering: {
    ...sampleData.roomHasTwoMembers,
    [anonymousAcceptedPath]: true,
    ...sampleData.secondRoomOfUser,
  },
};

function getFirstResult(target: Record<string, unknown>) {
  return target[Object.keys(target)[0]];
}

// eslint-disable-next-line jest/no-export
export function roomsQueryTest() {
  describe('rooms query test', () => {
    describe('read inside data on room test', () => {
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
      it('should show room member public_info', async () => {
        expect.assertions(1);
        await expect(
          getOnceVal(anonymousDb.ref(publicInfoPath)),
        ).resolves.toHaveProperty('room_id', userRoomId);
      });
      it('should not show non room member public_info', async () => {
        expect.assertions(1);
        await expect(
          discardOnceVal(anotherDb.ref(publicInfoPath)),
        ).toBePermissionDenied();
      });
    });
    describe('search rooms test', () => {
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
      it('should search room by using room_id', async () => {
        expect.assertions(1);
        await expect(
          getOnceVal(
            anonymousDb
              .ref(roomEntranceRoot)
              .orderByKey()
              .equalTo(userRoomId)
              .limitToFirst(1),
          ).then((results) => results[userRoomId!]),
        ).resolves.toStrictEqual(expectedObject.entranceOfUser);
      });
      it('should search rooms by using owner_id', async () => {
        expect.assertions(1);
        await expect(
          getOnceVal(
            userDb
              .ref(roomEntranceRoot)
              .orderByChild('owner_id')
              .equalTo(userUid)
              .limitToFirst(3),
          ).then(getFirstResult),
        ).resolves.toStrictEqual(expectedObject.entranceOfUser);
      });
      it('should search rooms by using room name', async () => {
        expect.assertions(1);
        await expect(
          getOnceVal(
            userDb
              .ref(roomEntranceRoot)
              .orderByChild('room_name')
              .startAt(sampleValueOfTalker.roomName)
              .endAt(`${sampleValueOfTalker.roomName}\uf8ff`)
              .limitToFirst(8),
          ).then(getFirstResult),
        ).resolves.toStrictEqual(expectedObject.entranceOfUser);
      });
      it('should search rooms order by room members count', async () => {
        expect.assertions(2);
        await assertAllSuccessLazy(
          expect(
            getOnceVal(
              userDb
                .ref(roomEntranceRoot)
                .orderByChild('members_count')
                .startAt(2)
                .endAt(300)
                .limitToFirst(8),
            ).then(getFirstResult),
          ).resolves.toStrictEqual(expectedObject.entranceOfUser),
          expect(
            getOnceVal(
              userDb
                .ref(roomEntranceRoot)
                .orderByChild('members_count')
                .startAt(2)
                .endAt(300)
                .limitToLast(8),
            ).then(getFirstResult),
          ).resolves.toStrictEqual(expectedObject.entranceOfUser),
        );
      });
      it('should search rooms order by created time', async () => {
        expect.assertions(2);
        await assertAllSuccessLazy(
          expect(
            getOnceVal(
              userDb
                .ref(roomEntranceRoot)
                .orderByChild('created_at')
                .endAt(Date.now())
                .limitToFirst(4),
            ).then(getFirstResult),
          ).resolves.toStrictEqual(expectedObject.entranceOfUser),
          expect(
            getOnceVal(
              userDb
                .ref(roomEntranceRoot)
                .orderByChild('created_at')
                .endAt(Date.now())
                .limitToLast(4),
            ).then(getFirstResult),
          ).resolves.toStrictEqual(expectedObject.entranceOfUser),
        );
      });
      it("should not search rooms by using other's owner_id", async () => {
        expect.assertions(1);
        await expect(
          discardOnceVal(
            anotherDb
              .ref(roomEntranceRoot)
              .orderByChild('owner_id')
              .equalTo(userUid)
              .limitToFirst(3),
          ),
        ).toBePermissionDenied();
      });
      it('should not search rooms using invelid ordering', async () => {
        expect.assertions(2);
        await assertAllSuccessLazy(
          expect(
            discardOnceVal(
              userDb
                .ref(roomEntranceRoot)
                .orderByChild('own_room_id')
                .limitToFirst(4),
            ),
          ).toBePermissionDenied(),
          expect(
            discardOnceVal(
              userDb
                .ref(roomEntranceRoot)
                .orderByChild('other_key')
                .limitToFirst(4),
            ),
          ).toBePermissionDenied(),
        );
      });
      it('should not search rooms using invelid limit', async () => {
        expect.assertions(12);
        await assertAllSuccessLazy(
          expect(
            discardOnceVal(
              userDb
                .ref(roomEntranceRoot)
                .orderByKey()
                .equalTo(userRoomId)
                .limitToFirst(2),
            ),
          ).toBePermissionDenied(),
          expect(
            discardOnceVal(
              userDb.ref(roomEntranceRoot).orderByKey().equalTo(userRoomId),
            ),
          ).toBePermissionDenied(),
          expect(
            discardOnceVal(
              userDb
                .ref(roomEntranceRoot)
                .orderByChild('owner_id')
                .equalTo(userUid)
                .limitToFirst(11),
            ),
          ).toBePermissionDenied(),
          expect(
            discardOnceVal(
              userDb
                .ref(roomEntranceRoot)
                .orderByChild('owner_id')
                .equalTo(userUid),
            ),
          ).toBePermissionDenied(),
          expect(
            discardOnceVal(
              userDb
                .ref(roomEntranceRoot)
                .orderByChild('room_name')
                .startAt(sampleValueOfTalker.roomName)
                .endAt(`${sampleValueOfTalker.roomName}\uf8ff`)
                .limitToFirst(11),
            ),
          ).toBePermissionDenied(),
          expect(
            discardOnceVal(
              userDb
                .ref(roomEntranceRoot)
                .orderByChild('room_name')
                .startAt(sampleValueOfTalker.roomName)
                .endAt(`${sampleValueOfTalker.roomName}\uf8ff`),
            ),
          ).toBePermissionDenied(),
          expect(
            discardOnceVal(
              userDb
                .ref(roomEntranceRoot)
                .orderByChild('members_count')
                .startAt(2)
                .endAt(300)
                .limitToFirst(11),
            ),
          ).toBePermissionDenied(),
          expect(
            discardOnceVal(
              userDb
                .ref(roomEntranceRoot)
                .orderByChild('members_count')
                .startAt(2)
                .endAt(300)
                .limitToLast(11),
            ),
          ).toBePermissionDenied(),
          expect(
            discardOnceVal(
              userDb
                .ref(roomEntranceRoot)
                .orderByChild('members_count')
                .startAt(2)
                .endAt(300),
            ),
          ).toBePermissionDenied(),
          expect(
            discardOnceVal(
              userDb
                .ref(roomEntranceRoot)
                .orderByChild('created_at')
                .endAt(Date.now())
                .limitToFirst(11),
            ),
          ).toBePermissionDenied(),
          expect(
            discardOnceVal(
              userDb
                .ref(roomEntranceRoot)
                .orderByChild('created_at')
                .endAt(Date.now())
                .limitToLast(11),
            ),
          ).toBePermissionDenied(),
          expect(
            discardOnceVal(
              userDb
                .ref(roomEntranceRoot)
                .orderByChild('created_at')
                .endAt(Date.now()),
            ),
          ).toBePermissionDenied(),
        );
      });
    });
  });
}
