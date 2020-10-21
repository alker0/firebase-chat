import { readFileSync } from 'fs';
import { join as pathJoin } from 'path';
import { fork } from 'child_process';
import {
  apps as firebaseApps,
  initializeTestApp,
  initializeAdminApp,
  loadDatabaseRules,
  assertFails,
} from '@firebase/rules-unit-testing';

import {
  SampleRulesCreatorMessage,
  SampleRulesKeys,
} from './sample-rules-creator-type';

import { getSampleDataCreator } from './sample-data-creator';

const cwd = process.cwd();

const DO_NOTHING = () => {};

const projectId = 'talker-v1';
const databaseName = 'talker-v1';
const rulesOfDatabaseJson = readFileSync(pathJoin(cwd, 'database.rules.json'), {
  encoding: 'utf-8',
});

const permDeniedCode = 'PERMISSION_DENIED';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const permDeniedMsg = 'PERMISSION_DENIED: Permission denied';

interface ErrorWithCode extends Error {
  code: string;
}

function consoleError(
  whenPermDenied: boolean = false,
): (error: Error | null) => void {
  function errorLog(error: Error | null) {
    if (error) {
      if ((error as ErrorWithCode).code === permDeniedCode) {
        if (whenPermDenied) console.log(permDeniedCode);
      } else {
        console.error(error);
      }
    }
  }
  Object.defineProperty(errorLog, 'name', { value: 'consoleError' });
  return errorLog;
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
  console.log(...(prefix ? [prefix, val] : [val]));
}

expect.extend({
  async toBePermissionDenied(dbAccess) {
    await assertFails(dbAccess);
    return {
      pass: true,
      message() {
        return `Unexpected ${permDeniedCode}`;
      },
    };
  },
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const currentRootStatusPrefix = 'current root status is:';

type DatabaseJsonKey = 'database-json';

type LoadRulesKeys = SampleRulesKeys | DatabaseJsonKey;

const sampleRulesCreator = fork(
  pathJoin(__dirname, 'sample-rules-creator.js'),
).on('error', (error) => {
  console.error(error);
  sampleRulesCreator.kill();
});

const sampleRulesPromiseStore: Record<
  SampleRulesKeys,
  Promise<string> | null
> = {
  sample1: null,
  whole: null,
};

const loadRules = (() => {
  let prevRulesKey: LoadRulesKeys;
  return async (rulesKey: LoadRulesKeys) => {
    let targetRulesText: string;
    if (rulesKey === 'database-json') {
      targetRulesText = rulesOfDatabaseJson;
    } else {
      const rulesText = sampleRulesPromiseStore[rulesKey];
      if (!rulesText) {
        console.error(`requested rules '${rulesKey}' has not been initialized`);
        return;
      }
      targetRulesText = await rulesText;
    }

    if (rulesKey === prevRulesKey) return;
    prevRulesKey = rulesKey;

    await loadDatabaseRules({
      databaseName,
      rules: targetRulesText,
    });
  };
})();

function useRules(targetRulesKey: LoadRulesKeys) {
  function loader() {
    return loadRules(targetRulesKey);
  }

  if (targetRulesKey === 'database-json') return loader;

  const storePromise = sampleRulesPromiseStore[targetRulesKey];
  if (storePromise) return loader;

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
  sampleRulesPromiseStore[targetRulesKey] = creating;
  sampleRulesCreator.send(targetRulesKey);

  return loader;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function* seriesPromiseGenerator() {
  let prevPromise = Promise.resolve();
  function createPromiseWithResolve() {
    let resultResolve = DO_NOTHING;
    const resultPromise = new Promise<undefined>((resolve) => {
      resultResolve = resolve;
    });
    return [resultResolve, resultPromise] as const;
  }

  let [currentResolve, currentPromise] = createPromiseWithResolve();

  while (true) {
    // eslint-disable-next-line no-await-in-loop
    await prevPromise;
    yield currentResolve;
    prevPromise = currentPromise;
    [currentResolve, currentPromise] = createPromiseWithResolve();
  }
}

async function waitPrevTest(
  prevTest: Promise<IteratorResult<() => void, void>>,
) {
  return (await prevTest).value as () => {};
}

const scheduler = seriesPromiseGenerator();

const userUid = 'nice';
const userAuth = {
  uid: userUid,
  provider: 'password',
  token: {
    email_verified: true,
  },
};
const userAppArg = {
  projectId,
  databaseName,
  auth: userAuth,
};

const userApp = initializeTestApp(userAppArg);

const notEmailVerifiedUserApp = initializeTestApp({
  ...userAppArg,
  auth: {
    ...userAppArg.auth,
    token: {
      email_verified: false,
    },
  },
});

const adminApp = initializeAdminApp({
  projectId,
  databaseName,
});

const userDb = userApp.database();
const notEmailVerifiedUserDb = notEmailVerifiedUserApp.database();
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
    console.error('terminating sample rule creator is failed');
  }
  await logOnceVal(adminRoot, 'last root status is:');
  await clearDb();
  await clearApps();
}

const createSampleData = getSampleDataCreator(userUid);

type DateOffsetUnit = 'milli' | 'second' | 'minute' | 'hour' | 'day' | 'week';
function getDateWithOffset(
  offsetInfo: Partial<Record<DateOffsetUnit, number>>,
) {
  const offsetMap: Record<
    DateOffsetUnit,
    (value: number | undefined) => number
  > = {
    milli: (value: number = 0) => value,
    get second() {
      return (value: number = 0) => value * 1000;
    },
    get minute() {
      return (value: number = 0) => offsetMap.second(value * 60);
    },
    get hour() {
      return (value: number = 0) => offsetMap.minute(value * 60);
    },
    get day() {
      return (value: number = 0) => offsetMap.hour(value * 24);
    },
    get week() {
      return (value: number = 0) => offsetMap.day(value * 7);
    },
  };
  return (
    new Date().getTime() +
    Object.entries(offsetInfo).reduce(
      (accum, [unitName, unitValue]) =>
        accum + offsetMap[unitName as DateOffsetUnit](unitValue),
      0,
    )
  );
}

const sampleData = {
  vaildCreate: createSampleData(),
  noPassword: createSampleData({
    overrides: {
      'rooms/password': null,
    },
  }),
  roomCreatedAtFuture: createSampleData({
    overrides: {
      'rooms/created_at': getDateWithOffset({ day: 1 }),
    },
  }),
  roomEntranceCreatedAtFuture: createSampleData({
    overrides: {
      'room_entrances/created_at': getDateWithOffset({ second: 1 }),
    },
  }),
};

async function setUpDb({
  prevTest = scheduler.next(),
  rulesKey = 'sample1',
  shouldClear = true,
}: {
  prevTest?: Promise<IteratorResult<() => void, void>>;
  rulesKey?: SampleRulesKeys;
  shouldClear?: boolean;
} = {}) {
  const ruleLoader = useRules(rulesKey);
  const endTest = await waitPrevTest(prevTest);
  const settingUp = (async () => {
    if (shouldClear) await clearDb();
    await ruleLoader();
  })();
  return [endTest, settingUp] as const;
}

describe('firebase-rdb-test', () => {
  afterAll(cleanup);
  describe('create room test', () => {
    it('should create valid data', async () => {
      expect.assertions(1);
      const [endTest, settingUp] = await setUpDb();
      try {
        await settingUp;
        await expect(
          userDb.ref().update(sampleData.vaildCreate, consoleError()),
        ).resolves.toBeUndefined();
      } finally {
        endTest();
      }
    });
    it('should not create no password key room', async () => {
      expect.assertions(1);
      const [endTest, settingUp] = await setUpDb();
      try {
        await settingUp;
        await expect(
          userDb.ref().update(sampleData.noPassword, consoleError()),
        ).toBePermissionDenied();
      } finally {
        endTest();
      }
    });
    it("should not create not email verified user's room", async () => {
      expect.assertions(1);
      const [endTest, settingUp] = await setUpDb();
      try {
        await settingUp;
        await expect(
          notEmailVerifiedUserDb
            .ref()
            .update(sampleData.vaildCreate, consoleError()),
        ).toBePermissionDenied();
      } finally {
        endTest();
      }
    });
    it("should not create not matched 'created_at' data", async () => {
      expect.assertions(2);
      const [endTest, settingUp] = await setUpDb();
      try {
        await settingUp;
        await expect(
          userDb.ref().update(sampleData.roomCreatedAtFuture, consoleError()),
        ).toBePermissionDenied();
        await expect(
          userDb
            .ref()
            .update(sampleData.roomEntranceCreatedAtFuture, consoleError()),
        ).toBePermissionDenied();
      } finally {
        endTest();
      }
    });
  });
});
