import { readFileSync } from 'fs';
import { join as pathJoin } from 'path';
import { fork } from 'child_process';
import firebase from 'firebase';
import {
  loadDatabaseRules,
  initializeTestApp,
} from '@firebase/rules-unit-testing';
import { AppOptions } from '@firebase/rules-unit-testing/dist/src/api';

const cwd = process.cwd();

const DO_NOTHING = () => {};

const rulesOfDatabaseJson = readFileSync(pathJoin(cwd, 'database.rules.json'), {
  encoding: 'utf-8',
});

export const permDeniedCode = 'PERMISSION_DENIED';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const permDeniedMsg = 'PERMISSION_DENIED: Permission denied';

interface ErrorWithCode extends Error {
  code: string;
}

export function isErrorWithCode(error: unknown): error is ErrorWithCode {
  return (
    error &&
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

export const sampleRulesCreator = fork(
  pathJoin(__dirname, 'sample-rules-creator.js'),
).on('error', (error: unknown) => {
  console.error(error);
  sampleRulesCreator.kill();
});

export function killSampleRulesCreator() {
  if (!sampleRulesCreator.kill()) {
    console.error('terminating sample rule creator is failed');
  }
}

export type DatabaseJsonKey = 'database-json';
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

export function createRulesLoader<
  T extends string,
  U extends LoadRulesKeys<T> = LoadRulesKeys<T>
>(
  databaseName: string,
  sampleRulesPromiseStoreArg: SampleRulesPromiseStore<T>,
) {
  const sampleRulesPromiseStore: SampleRulesPromiseStore<U> = {
    ...sampleRulesPromiseStoreArg,
    'database-json': Promise.resolve(rulesOfDatabaseJson),
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
    if (targetRulesKey === 'database-json') return loader;

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
    sampleRulesCreator.send(targetRulesKey);

    return loader;
  }

  return {
    sampleRulesPromiseStore,
    loadRules,
    useRules,
  };
}

// type PromiseResolveArg<T> = T | PromiseLike<T>;
// type PromiseResolveFunction<T> = (value: PromiseResolveArg<T>) => void;
// type PromiseRejectFunction = (reason: unknown) => void;
// interface SendHandleFn {
//   <T = unknown>(
//     value: T,
//     resolve: PromiseResolveFunction<T>,
//     reject: PromiseRejectFunction,
//   ): void;
// }

// function defaultSendHandleFunction<T = unknown>(
//   value: T,
//   resolve: PromiseResolveFunction<T>,
//   reject: PromiseRejectFunction,
// ) {
//   if (value) {
//     resolve(value);
//   } else {
//     reject(new Error('falsy value is sent'));
//   }
// }

// export function createPromiseInfoCreator(
//   defaultSendHandleFn: SendHandleFn = defaultSendHandleFunction,
// ) {
//   return function createPromiseInfo<T = unknown>(
//     sendHandleFn: (
//       value: T,
//       resolve: PromiseResolveFunction<T>,
//       reject: PromiseRejectFunction,
//     ) => void = defaultSendHandleFn,
//   ) {
//     let resolve: PromiseResolveFunction<T> = () => {};
//     let reject: PromiseRejectFunction = () => {};
//     const promise = new Promise<unknown>((resolveFn, rejectFn) => {
//       resolve = resolveFn;
//       reject = rejectFn;
//     }).catch(console.error);
//     return {
//       promise,
//       resolve,
//       reject,
//       send: (value: T) => sendHandleFn(value, resolve, reject),
//     };
//   };
// }

export async function* seriesPromiseGenerator() {
  let prevPromise = Promise.resolve();
  function createPromiseWithResolve() {
    let resultResolve = DO_NOTHING;
    const resultPromise = new Promise<undefined>((resolve) => {
      resultResolve = resolve;
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
  prevTest: Promise<IteratorResult<() => void, void>>,
) {
  return (await prevTest).value as () => {};
}

export function createDbSettUpper<T extends string>(
  rulesRequester: RulesRequester<LoadRulesKeys<T>>,
  defaultInitializer: () => Promise<unknown>,
  defaultScheduler: AsyncGenerator<() => void, void, unknown>,
  defaultRulesKey: T,
) {
  return async function setUpDb({
    scheduler = defaultScheduler,
    rulesKey: targetRulesKey = defaultRulesKey,
    shouldInit = true,
    initializer = defaultInitializer,
  }: {
    scheduler?: AsyncGenerator<() => void, void, unknown>;
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

// export function hasOwnProperty(
//   target: unknown,
//   key: string,
// ): key is keyof typeof target {
//   return Object.prototype.hasOwnProperty.call(target, key);
// }

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
