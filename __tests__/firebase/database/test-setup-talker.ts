import {
  apps as firebaseApps,
  initializeAdminApp,
} from '@firebase/rules-unit-testing';

import {
  getDateWithOffset,
  createSampleDataCreatorForTalker,
} from './sample-data-creator';
import {
  logOnceVal,
  seriesPromiseGenerator,
  killSampleRulesCreator,
  createRulesLoader,
  createPromiseInfoCreator,
  createUserContextCreator,
  ThenableRef,
  emailVerifiedAuth,
  createDbSettUpper,
} from './rules-test-utils';
import { SampleRulesKeys } from './sample-rules-creator-type';

export const projectId = 'talker-v1';
export const databaseName = 'talker-v1';

export const { useRules } = createRulesLoader<SampleRulesKeys>(databaseName, {
  sample1: null,
  whole: null,
});

export const scheduler = seriesPromiseGenerator();

export const roomEntranceRootPath = 'room_entrance';

export interface UserContext {
  roomRef: ThenableRef;
  roomId: ThenableRef['key'];
}

export const createUserContext = createUserContextCreator<UserContext>(
  {
    projectId,
    databaseName,
  },
  (db) => {
    const roomRef = db.ref(roomEntranceRootPath).push();
    return {
      roomRef,
      roomId: roomRef.key,
    };
  },
);

export const userUid = 'nice';
export const userContext = createUserContext({
  ...emailVerifiedAuth,
  uid: userUid,
});

export const anotherUid = 'great';
export const anotherContext = createUserContext({
  ...emailVerifiedAuth,
  uid: anotherUid,
});

export const onlyPasswordUid = 'owesome';
export const onlyPasswordContext = createUserContext({
  provider: 'password',
  token: {
    email_verified: false,
  },
  uid: onlyPasswordUid,
});

export const anonymousUid = 'wonderful';
export const anonymousContext = createUserContext({
  provider_id: 'anonymous',
  uid: anonymousUid,
});

export const [userDb, anotherDb, onlyPassDb, anonymousDb] = ([
  userContext,
  anotherContext,
  onlyPasswordContext,
  anonymousContext,
] as const).map((context) => context.db);

export const adminApp = initializeAdminApp({
  projectId,
  databaseName,
});

export const adminDb = adminApp.database();
export const adminRoot = adminDb.ref();
export const clearDb = adminRoot.remove.bind(
  adminRoot,
) as typeof adminRoot.remove;

export function clearApps() {
  return Promise.all(
    firebaseApps()
      .concat(adminApp)
      .map((app) => app.delete()),
  );
}

export async function cleanup() {
  killSampleRulesCreator();
  await logOnceVal(adminRoot, 'last root status is:');
  await clearDb();
  await clearApps();
}

export const createSampleData = createSampleDataCreatorForTalker;
export const sampleOfUser = createSampleData({
  rootKeyMapArg: { userUid, roomId: userContext.roomId },
});
export const sampleOfAnother = createSampleData({
  rootKeyMapArg: { userUid: anotherUid, roomId: anotherContext.roomId },
});
export const sampleOfOnlyPass = createSampleData({
  rootKeyMapArg: {
    userUid: onlyPasswordUid,
    roomId: onlyPasswordContext.roomId,
  },
});
export const sampleOfAnonymous = createSampleData({
  rootKeyMapArg: { userUid: anonymousUid, roomId: anonymousContext.roomId },
});

export const sampleData = {
  roomOfUser: sampleOfUser.sampleData,
  roomOfAnother: sampleOfAnother.sampleData,
  roomOfOnlyPass: sampleOfOnlyPass.sampleData,
  roomOfAnonymous: sampleOfAnonymous.sampleData,
  emptyPassword: sampleOfUser.createFixed((rootKeyMap) => [
    [[rootKeyMap['key-room_members/password']], ''],
  ]),
  withOutEntranceOfUser: sampleOfUser.createFixed((rootKeyMap) => [
    [[rootKeyMap['key-room_entrances']], null],
  ]),
  withOutOwnRoomsInfoOfAnother: sampleOfAnother.createFixed((rootKeyMap) => [
    [[rootKeyMap['key-rooms/public_info']], null],
  ]),
  withOutPasswordOfUser: sampleOfAnother.createFixed((rootKeyMap) => [
    [[rootKeyMap['key-room_members/password']], null],
  ]),
  roomCreatedAtFuture: sampleOfUser.createFixed((rootKeyMap) => [
    [
      [rootKeyMap['key-room_entrances'], 'created_at'],
      getDateWithOffset({ minute: 1 }),
    ],
  ]),
  deletedOfUser: sampleOfUser.createFixed((rootKeyMap) => [
    [[rootKeyMap['key-rooms/public_info']], null],
    [[rootKeyMap['key-room_entrances']], null],
    [[rootKeyMap['key-room_members/password']], null],
    [[rootKeyMap['key-room_members/denied']], null],
  ]),
};

export const setUpDb = createDbSettUpper(
  adminDb,
  useRules,
  scheduler,
  'sample1',
);

export const createPromiseInfo = createPromiseInfoCreator();

export const dependsMap = {
  requestable: createPromiseInfo(),
  roomCreatable: createPromiseInfo(),
};

export function isNotPassword(target: unknown) {
  return target !== 'password';
}

export function getOnlyRequestUid(target: any) {
  return Object.keys(target).filter(isNotPassword);
}
