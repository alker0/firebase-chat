import {
  apps as firebaseApps,
  initializeAdminApp,
  database as firebaseDb,
} from '@firebase/rules-unit-testing';

import {
  getDateWithOffset,
  createSampleDataCreatorForTalker,
  PropertyKeysOfTalker,
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

export const roomEntranceRoot = 'room_entrances';
export const roomMembersInfoRoot = 'room_members_info';

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
    const roomRef = db.ref(roomEntranceRoot).push();
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

export type FixInfoPartsKeys =
  | 'emptyPassword'
  | 'nonPublicInfo'
  | 'nonEntrance'
  | 'nonPassword'
  | 'nonDenied';

export const fixInfoParts: Record<
  FixInfoPartsKeys,
  (rootKeyMap: Record<PropertyKeysOfTalker, string>) => [string[], any]
> = {
  emptyPassword: (rootKeyMap) => [
    [rootKeyMap['key-room_members/password']],
    '',
  ],
  nonPublicInfo: (rootKeyMap) => [[rootKeyMap['key-rooms/public_info']], null],
  nonEntrance: (rootKeyMap) => [[rootKeyMap['key-room_entrances']], null],
  nonPassword: (rootKeyMap) => [
    [rootKeyMap['key-room_members/password']],
    null,
  ],
  nonDenied: (rootKeyMap) => [[rootKeyMap['key-room_members/denied']], null],
};

export const sampleData = {
  roomOfUser: sampleOfUser.sampleData,
  roomOfAnother: sampleOfAnother.sampleData,
  roomOfOnlyPass: sampleOfOnlyPass.sampleData,
  roomOfAnonymous: sampleOfAnonymous.sampleData,
  emptyPassword: sampleOfUser.createFixed((roomsKeyMap) => [
    fixInfoParts.emptyPassword(roomsKeyMap),
  ]),
  withOutEntranceOfUser: sampleOfUser.createFixed((roomsKeyMap) => [
    fixInfoParts.nonEntrance(roomsKeyMap),
  ]),
  withOutOwnRoomsInfoOfAnother: sampleOfAnother.createFixed((roomsKeyMap) => [
    fixInfoParts.nonPublicInfo(roomsKeyMap),
  ]),
  withOutPasswordOfUser: sampleOfAnother.createFixed((roomsKeyMap) => [
    fixInfoParts.nonPassword(roomsKeyMap),
  ]),
  roomCreatedAtFuture: sampleOfUser.createFixed((rootKeyMap) => [
    [
      [rootKeyMap['key-room_entrances'], 'created_at'],
      getDateWithOffset({ minute: 1 }),
    ],
  ]),
  deletedOfUser: sampleOfUser.createFixed((rootKeyMap) => [
    fixInfoParts.nonPublicInfo(rootKeyMap),
    fixInfoParts.nonEntrance(rootKeyMap),
    fixInfoParts.nonPassword(rootKeyMap),
    fixInfoParts.nonDenied(rootKeyMap),
  ]),
};

export const serverValue = {
  increment: firebaseDb.ServerValue.increment,
  TIMESTAMP: firebaseDb.ServerValue.TIMESTAMP,
};

export const scheduler = seriesPromiseGenerator();

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

jest.setTimeout(10000);
