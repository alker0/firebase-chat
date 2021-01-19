import { resolve as pathResolve } from 'path';
import {
  apps as firebaseApps,
  initializeAdminApp,
  database as firebaseDb,
} from '@firebase/rules-unit-testing';

import {
  createSampleDataCreatorForTalker,
  PropertyKeysOfTalker,
  defaultSampleOfTalker,
} from './sample-data-creator';
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  logOnceVal,
  seriesPromiseGenerator,
  createUserContextCreator,
  ThenableRef,
  emailVerifiedAuth,
  createDbSettUpper,
  getDateWithOffset,
  createSampleRulesFactory,
} from './rules-test-utils';
import { SampleRulesKeys } from './sample-rules';

export const projectId = 'talker-v1';
export const databaseName = 'talker-v1';

const { createRulesLoader, killSampleRulesCreator } = createSampleRulesFactory({
  bridgeJsAbsPath: pathResolve(__dirname, './sample-rules-creator-bridge.js'),
  tsNodeOption: { project: pathResolve(__dirname, '../../tsconfig.json') },
  creatorTsAbsPath: pathResolve(__dirname, './sample-rules-creator.ts'),
});

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
  // await logOnceVal(adminRoot, 'last root status is:');
  await clearDb();
  await clearApps();
}

const secondRoomIdOfUser = adminDb.ref(roomEntranceRoot).push().key;

export const createSampleData = createSampleDataCreatorForTalker;
export const sampleOfUser = createSampleData({
  rootKeyMapArg: { userUid, roomId: userContext.roomId },
});
export const secondSampleOfUser = createSampleData({
  rootKeyMapArg: { userUid, ownRoomId: 1, roomId: secondRoomIdOfUser },
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

export const serverValue = firebaseDb.ServerValue;

export const sampleValueOfTalker = {
  ...defaultSampleOfTalker,
  emptyData: {},
  passwordMax: Array(20 - 1)
    .fill('a')
    .join(''),
  roomNameMax: Array(20 - 1)
    .fill('b')
    .join(''),
  createdAtMin: 0,
  createdAtMax: serverValue.TIMESTAMP,
  ownRoomIdMin: (0).toString(),
  ownRoomIdMax: (2).toString(),
  membersCountMin: 1,
  membersCountMax: 100000 - 1,
  secondRoomIdOfUser,
  secondRoomNameOfUser: 'excellent',
};

export const sampleData = {
  roomOfUser: sampleOfUser.sampleData,
  roomOfAnother: sampleOfAnother.sampleData,
  roomOfOnlyPass: sampleOfOnlyPass.sampleData,
  roomOfAnonymous: sampleOfAnonymous.sampleData,
  secondRoomOfUser: secondSampleOfUser.createFixed((rootKeyMap) => [
    [
      [rootKeyMap['key-room_entrances'], 'room_name'],
      sampleValueOfTalker.secondRoomNameOfUser,
    ],
  ]),
  emptyPassword: sampleOfUser.createFixed((rootKeyMap) => [
    fixInfoParts.emptyPassword(rootKeyMap),
  ]),
  maxLengthPassword: sampleOfUser.createFixed((rootKeyMap) => [
    [
      [rootKeyMap['key-room_members/password']],
      sampleValueOfTalker.passwordMax,
    ],
  ]),
  tooLongPassword: sampleOfUser.createFixed((rootKeyMap) => [
    [
      [rootKeyMap['key-room_members/password']],
      `${sampleValueOfTalker.passwordMax}a`,
    ],
  ]),
  emptyRoomName: sampleOfUser.createFixed((rootKeyMap) => [
    [[rootKeyMap['key-room_entrances'], 'room_name'], ''],
  ]),
  maxLengthRoomName: sampleOfUser.createFixed((rootKeyMap) => [
    [
      [rootKeyMap['key-room_entrances'], 'room_name'],
      sampleValueOfTalker.roomNameMax,
    ],
  ]),
  tooLongRoomName: sampleOfUser.createFixed((rootKeyMap) => [
    [
      [rootKeyMap['key-room_entrances'], 'room_name'],
      `${sampleValueOfTalker.roomNameMax}b`,
    ],
  ]),
  withOutEntranceOfUser: sampleOfUser.createFixed((rootKeyMap) => [
    fixInfoParts.nonEntrance(rootKeyMap),
  ]),
  withOutOwnRoomsInfoOfAnother: sampleOfAnother.createFixed((rootKeyMap) => [
    fixInfoParts.nonPublicInfo(rootKeyMap),
  ]),
  withOutPasswordOfUser: sampleOfAnother.createFixed((rootKeyMap) => [
    fixInfoParts.nonPassword(rootKeyMap),
  ]),
  roomCreatedAtFuture: sampleOfUser.createFixed((rootKeyMap) => [
    [
      [rootKeyMap['key-room_entrances'], 'created_at'],
      getDateWithOffset({ minute: 1 }),
    ],
  ]),
  roomHasTwoMembers: sampleOfUser.createFixed((rootKeyMap) => [
    [[rootKeyMap['key-room_entrances'], 'members_count'], 2],
  ]),
  secondRoomHasTwoMembers: secondSampleOfUser.createFixed((rootKeyMap) => [
    [[rootKeyMap['key-room_entrances'], 'members_count'], 2],
  ]),
  deletedOfUser: sampleOfUser.createFixed((rootKeyMap) => [
    fixInfoParts.nonPublicInfo(rootKeyMap),
    fixInfoParts.nonEntrance(rootKeyMap),
    fixInfoParts.nonPassword(rootKeyMap),
    fixInfoParts.nonDenied(rootKeyMap),
  ]),
};

export const defaultScheduler = seriesPromiseGenerator();
export const childScheduler = seriesPromiseGenerator();

export const setUpDb = createDbSettUpper(
  useRules,
  clearDb,
  defaultScheduler,
  'sample1',
);

export function isNotPassword(target: unknown) {
  return target !== 'password';
}

export function getOnlyRequestUid(target: any) {
  return Object.keys(target).filter(isNotPassword);
}

jest.setTimeout(10000);
