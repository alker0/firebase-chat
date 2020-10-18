import { readFileSync } from 'fs';
import { join as pathJoin } from 'path';
// import { fork, Serializable } from 'child_process';
import {
  apps as firebaseApps,
  initializeTestApp,
  initializeAdminApp,
  loadDatabaseRules,
  // assertFails,
} from '@firebase/rules-unit-testing';
// import { ResultRuleObject } from '@scripts/database-rules-build-core';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { sampleRule1, wholeRules } from './rule-samples';

const cwd = process.cwd();

const projectId = 'talker-v1';
const databaseName = 'talker-v1';
const rulesOfDatabaseJson = readFileSync(pathJoin(cwd, 'database.rules.json'), {
  encoding: 'utf-8',
});

const permDenied = 'PERMISSION_DENIED';

interface ErrorWithCode extends Error {
  code: string;
}

function consoleError(error: Error | null) {
  if (error) {
    if ((error as ErrorWithCode).code === permDenied) {
      console.log(permDenied);
    } else {
      console.error(error);
    }
  }
}

async function onceVal(reference: firebase.database.Reference) {
  const snapshot = await reference.once('value', undefined, consoleError);
  return snapshot.val();
}

async function logOnceVal(
  reference: firebase.database.Reference,
  prefix?: string,
) {
  const val = await onceVal(reference);
  console.log(...(prefix ? [prefix] : []).concat(val));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const currentRootStatusPrefix = 'current root status is:';

// const stringifier = fork(pathJoin(__dirname, 'stringifier.ts')).on(
//   'error',
//   (error) => {
//     console.error(error);
//     stringifier.kill();
//   },
// );

async function loadRules(targetRulesText: string) {
  await loadDatabaseRules({
    databaseName,
    rules: targetRulesText,
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function loadRulesFromDatabaseJson() {
  await loadRules(rulesOfDatabaseJson);
}

const sampleRulesObjectMap = {
  sample1: sampleRule1,
  whole: wholeRules,
};

type SampleRulesKey = keyof typeof sampleRulesObjectMap;

interface RuleTextStore extends Partial<Record<SampleRulesKey, string>> {}

const rulesTextStore: RuleTextStore = {};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function loadRulesFromSample(sampleRulesKey: SampleRulesKey) {
  let sampleRulesText: string;
  const textInStore = rulesTextStore[sampleRulesKey];

  if (textInStore) {
    sampleRulesText = textInStore;
  } else {
    const stringified = JSON.stringify(sampleRulesObjectMap[sampleRulesKey]);
    rulesTextStore[sampleRulesKey] = stringified;
    sampleRulesText = stringified;
  }

  await loadRules(sampleRulesText);
}

const userUid = 'nice';
const userAuth = {
  uid: userUid,
  provider: 'password',
  token: {
    email_verified: true,
  },
};

const userApp = initializeTestApp({
  projectId,
  databaseName,
  auth: userAuth,
});

const adminApp = initializeAdminApp({
  projectId,
  databaseName,
});

const userDb = userApp.database();
const adminDb = adminApp.database();
const adminRoot = adminDb.ref();

const clearDb = adminRoot.remove.bind(adminRoot) as typeof adminRoot.remove;

async function clearApps() {
  await Promise.all(
    firebaseApps()
      .concat(adminApp)
      .map((app) => app.delete()),
  );
}

async function cleanup() {
  await logOnceVal(adminRoot, 'last root status is:');
  await clearDb();
  await clearApps();
  // stringifier.kill();
}

const roomId = '101';
const ownRoomId = '1';
const createdAt = 0;

const validData = {
  [`rooms/${userUid}/${ownRoomId}`]: {
    public_info: {
      room_id: roomId,
      // allowed_users: {},
      allowed_users_count: 0,
    },
    password: 'nnn',
    created_at: createdAt,
  },
  [`room_entrances/${roomId}`]: {
    owner_id: userUid,
    own_room_id: '1',
    room_name: 'nice_room',
    members_count: 1,
    created_at: createdAt,
  },
};

console.log('validData is:', validData);

describe('firebase-rdb-test', () => {
  // loadRules();
  afterAll(cleanup);
  describe('create room test', () => {
    it('should be success', async () => {
      expect.assertions(2);
      await clearDb();
      await loadRulesFromSample('sample1');
      await expect(onceVal(adminRoot)).resolves.toBeNull();
      await expect(
        userDb.ref().update(validData, consoleError),
      ).resolves.toBeUndefined();
    });
  });
});
