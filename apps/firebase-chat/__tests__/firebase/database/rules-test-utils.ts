import { readFileSync } from 'fs';
import { join as pathJoin } from 'path';
import { Worker } from 'worker_threads';
import firebase from 'firebase';
import {
  loadDatabaseRules,
  initializeTestApp,
} from '@firebase/rules-unit-testing';
import { AppOptions } from '@firebase/rules-unit-testing/dist/src/api';
import { RulesFactoryOptions } from './rules-factory';

const cwd = process.cwd();

interface VoidFunction {
  (): void;
}

function doNothing() {}

const rulesOfDatabaseJson = readFileSync(pathJoin(cwd, 'database.rules.json'), {
  encoding: 'utf-8',
});

export const permDeniedCode = 'PERMISSION_DENIED';
export const permDeniedMsg = 'PERMISSION_DENIED: Permission denied';

interface ErrorWithCode extends Error {
  code: string;
}

export function isErrorWithCode(error: unknown): error is ErrorWithCode {
  return (
    Boolean(error) &&
    typeof error === 'object' &&
    Object.prototype.hasOwnProperty.call(error, 'message') &&
    Object.prototype.hasOwnProperty.call(error, 'code')
  );
}

export function isPermissionDeniedError(
  error: unknown,
): error is ErrorWithCode {
  if (isErrorWithCode(error)) {
    return (
      error.message.toUpperCase().indexOf(permDeniedCode) >= 0 ||
      error.code.replace('-', '_').toUpperCase() === permDeniedCode
    );
  } else {
    return false;
  }
}

export function logNonPermissionDeniedError(error: Error | null) {
  if (error) {
    if ((error as ErrorWithCode).code !== permDeniedCode) {
      console.error(error);
    }
  }
}

export { logNonPermissionDeniedError as logNonPermDenied };

export type OnceGettable =
  | firebase.database.Reference
  | firebase.database.Query;

export const currentRootStatusPrefix = 'current root status is:';
export const lastRootStatusPrefix = 'last root status is:';

export async function getOnceVal(reference: OnceGettable) {
  const snapshot = await reference.once(
    'value',
    undefined,
    logNonPermissionDeniedError,
  );
  return snapshot.val();
}

export async function discardOnceVal(reference: OnceGettable) {
  await getOnceVal(reference);
}

export async function logOnceVal(reference: OnceGettable, prefix?: string) {
  const val = await getOnceVal(reference);
  console.log(...(prefix ? [prefix, val] : [val]));
}

const databaseJsonKey = 'database-json';
export type DatabaseJsonKey = typeof databaseJsonKey;
export type LoadRulesKeys<T extends string> = T | DatabaseJsonKey;

export type SampleRulesPromiseStore<T extends string> = Record<
  T,
  Promise<string> | null
>;

export interface SampleRulesCreatorMessage<T extends string> {
  rulesKey: T;
  rulesText: string;
}

export interface RulesRequester<T extends string> {
  (targetRulesKey: T): () => Promise<void>;
}

export function createSampleRulesFactory(options: RulesFactoryOptions) {
  const sampleRulesCreator = new Worker(options.bridgeJsAbsPath, {
    workerData: options,
  }).on('error', (error: unknown) => {
    console.error(error);
    sampleRulesCreator.terminate();
  });

  function killSampleRulesCreator() {
    if (!sampleRulesCreator.terminate()) {
      console.error('terminating sample rule creator is failed');
    }
  }

  function createRulesLoader<
    T extends string,
    U extends LoadRulesKeys<T> = LoadRulesKeys<T>
  >(
    databaseName: string,
    sampleRulesPromiseStoreArg: SampleRulesPromiseStore<T>,
  ) {
    const sampleRulesPromiseStore: SampleRulesPromiseStore<U> = {
      ...sampleRulesPromiseStoreArg,
      [databaseJsonKey]: Promise.resolve(rulesOfDatabaseJson),
    };

    let prevRulesKey: U;
    async function loadRules(targetRulesKey: U) {
      const rulesText = sampleRulesPromiseStore[targetRulesKey];
      if (!rulesText) {
        console.error(
          `requested rules '${targetRulesKey}' has not been initialized`,
        );
        return;
      }
      const targetRulesText = await rulesText!;

      if (targetRulesKey === prevRulesKey) return;
      prevRulesKey = targetRulesKey;

      await loadDatabaseRules({
        databaseName,
        rules: targetRulesText,
      });
    }

    function useRules(targetRulesKey: U) {
      function loader() {
        return loadRules(targetRulesKey);
      }
      if (targetRulesKey === databaseJsonKey) return loader;

      const storePromise = sampleRulesPromiseStore[targetRulesKey];
      if (storePromise) return loader;

      const creating = new Promise<string>((resolve) => {
        sampleRulesCreator.on('message', (message) => {
          if (typeof message === 'object') {
            const { rulesKey, rulesText } = message as Partial<
              SampleRulesCreatorMessage<T>
            >;
            if (rulesKey && rulesText) {
              resolve(rulesText);
            }
          }
        });
      });
      sampleRulesPromiseStore[targetRulesKey] = creating;
      sampleRulesCreator.postMessage(targetRulesKey);

      return loader;
    }

    return {
      sampleRulesPromiseStore,
      loadRules,
      useRules,
    };
  }

  return {
    killSampleRulesCreator,
    createRulesLoader,
  };
}

export async function* seriesPromiseGenerator() {
  let prevPromise = Promise.resolve();
  function createPromiseWithResolve() {
    let resultResolve = doNothing;
    const resultPromise = new Promise<undefined>((resolve) => {
      resultResolve = resolve as VoidFunction;
    });
    return [resultPromise, resultResolve] as const;
  }

  let [currentPromise, currentResolve] = createPromiseWithResolve();

  while (true) {
    // eslint-disable-next-line no-await-in-loop
    await prevPromise;
    yield currentResolve;
    prevPromise = currentPromise;
    [currentPromise, currentResolve] = createPromiseWithResolve();
  }
}

export async function waitPrevTest(
  prevTest: Promise<IteratorResult<VoidFunction, void>>,
) {
  return (await prevTest).value as () => {};
}

interface VoidGenerator extends AsyncGenerator<VoidFunction, void, unknown> {}

export function createDbSettUpper<T extends string>(
  rulesRequester: RulesRequester<LoadRulesKeys<T>>,
  defaultInitializer: () => Promise<unknown>,
  defaultScheduler: VoidGenerator,
  defaultRulesKey: T,
) {
  return async function setUpDb({
    scheduler = defaultScheduler,
    rulesKey: targetRulesKey = defaultRulesKey,
    shouldInit = true,
    initializer = defaultInitializer,
  }: {
    scheduler?: VoidGenerator;
    rulesKey?: T;
    shouldInit?: boolean;
    initializer?: () => Promise<unknown>;
  } = {}) {
    const ruleLoader = rulesRequester(targetRulesKey);
    const endTest = await waitPrevTest(scheduler.next());
    const settingUp = (async () => {
      if (shouldInit) await initializer();
      try {
        await ruleLoader();
      } catch (error) {
        console.error(error);
      }
    })();
    return [settingUp, endTest] as const;
  };
}

export async function assertAllSuccessLazy(...promises: Promise<unknown>[]) {
  (await Promise.allSettled(promises)).forEach((promiseResult) => {
    if (promiseResult.status === 'rejected') {
      throw promiseResult.reason;
    }
  });
}

export interface DatabaseType extends firebase.database.Database {}
export interface ThenableRef extends firebase.database.ThenableReference {}

export function createUserContextCreator<T extends {} = {}>(
  baseAppOptions: AppOptions,
  additionalInfoFn: (db: DatabaseType) => T,
) {
  function createUserContext(auth: AppOptions['auth']) {
    const appOption = {
      ...baseAppOptions,
      auth,
    };
    const app = initializeTestApp(appOption);
    const db = (app.database() as unknown) as DatabaseType;
    const additionalInfo = additionalInfoFn(db);
    return {
      app,
      db,
      ...additionalInfo,
    };
  }
  return createUserContext;
}

export function updateOnRoot(
  dbArg: DatabaseType,
  values: Object,
  onComplete: ((a: Error | null) => any) | false = logNonPermissionDeniedError,
) {
  return dbArg.ref().update(values, onComplete || undefined);
}

export const emailVerifiedAuth = {
  provider: 'password',
  token: {
    email_verified: true,
  },
};

export type DateOffsetUnit =
  | 'milli'
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'week';

export function getDateWithOffset(
  offsetInfo: Partial<Record<DateOffsetUnit, number>> = {},
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
    Date.now() +
    Object.entries(offsetInfo).reduce(
      (accum, [unitName, unitValue]) =>
        accum + offsetMap[unitName as DateOffsetUnit](unitValue),
      0,
    )
  );
}
