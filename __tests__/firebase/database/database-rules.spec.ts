import { readFileSync } from 'fs';
import { join as pathJoin } from 'path';
import { fork } from 'child_process';
import {
  apps as firebaseApps,
  initializeTestApp,
  initializeAdminApp,
  loadDatabaseRules,
  // assertFails,
} from '@firebase/rules-unit-testing';
// import { ResultRuleObject } from '@scripts/database-rules-build-core';
// import { sampleRule1, wholeRules } from './rule-samples';
import {
  SampleRulesCreatorMessage,
  SampleRulesKeys,
} from './sample-rules-creator-type';

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

const sampleRulesCreator = fork(
  pathJoin(__dirname, 'sample-rules-creator.js'),
).on('error', (error) => {
  console.error(error);
  sampleRulesCreator.kill();
});

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

const sampleRulesPromiseStore: Record<
  SampleRulesKeys,
  Promise<string> | null
> = {
  sample1: null,
  whole: null,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getSampleRules(sampleRulesKey: SampleRulesKeys) {
  const storePromise = sampleRulesPromiseStore[sampleRulesKey];
  if (storePromise) {
    return storePromise;
  } else {
    const creating = new Promise<string>((resolve) => {
      sampleRulesCreator.on('message', (message) => {
        if (typeof message === 'object') {
          const { rulesKey, rulesText } = message as Partial<
            SampleRulesCreatorMessage
          >;
          if (rulesKey && rulesText) {
            resolve(rulesText);
          }
        }
      });
    });
    sampleRulesPromiseStore[sampleRulesKey] = creating;
    sampleRulesCreator.send(sampleRulesKey);
    return creating;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function* seriesPromiseGenerator() {
  let currentResolve;
  function updateCurrentResolve() {
    return new Promise<undefined>((resolve) => {
      currentResolve = resolve;
    });
  }
  let currentPromise = updateCurrentResolve();
  let prevPromise = Promise.resolve(currentResolve);

  while (true) {
    yield prevPromise;
    prevPromise = currentPromise;
    currentPromise = updateCurrentResolve();
  }
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
  if (!sampleRulesCreator.kill()) {
    console.error('killing sample rule creator is failed');
  }
  await logOnceVal(adminRoot, 'last root status is:');
  await clearDb();
  await clearApps();
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
    it('should create valid-data', async () => {
      expect.assertions(2);
      await clearDb();
      const sampleRules = await getSampleRules('sample1');
      await loadRules(sampleRules);
      await expect(onceVal(adminRoot)).resolves.toBeNull();
      await expect(
        userDb.ref().update(validData, consoleError),
      ).resolves.toBeUndefined();
    });
  });
});
