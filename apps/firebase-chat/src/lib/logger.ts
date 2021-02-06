import { IS_NOT_PRODUCTION, IS_PRODUCTION } from './constants';

export type LogContentPair = [string, ...any[]];

export type LogContentPairs = LogContentPair[];

function getFixedPrefix(prefix: string) {
  return prefix
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[-: ]/g, '_');
}

function getFixedEnvKey(prefix: string, envKey?: string) {
  return envKey ?? getFixedPrefix(prefix);
}

function includesInEnv(envName: unknown, targetKey: string) {
  return String(envName).toLowerCase().split(':').includes(targetKey);
}

export interface ShouldLogOption {
  prefix: string;
  envKey?: string;
  defaultDo?: boolean;
}

export interface LogOption extends ShouldLogOption {
  skipCheck?: boolean;
}

export function shouldLog({
  prefix,
  envKey,
  defaultDo = true,
}: ShouldLogOption): boolean {
  if (IS_PRODUCTION) return false;
  const fixedEnvKey = getFixedEnvKey(prefix, envKey);
  return defaultDo
    ? !includesInEnv(
        import.meta.env.SNOWPACK_PUBLIC_LOG_DISABLE_PREFIX,
        fixedEnvKey,
      )
    : includesInEnv(
        import.meta.env.SNOWPACK_PUBLIC_LOG_ENABLE_PREFIX,
        fixedEnvKey,
      );
}

function groupStart(prefix: string, envKey: string) {
  if (
    includesInEnv(import.meta.env.SNOWPACK_PUBLIC_LOG_COLLAPSED_PREFIX, envKey)
  ) {
    console.groupCollapsed(prefix);
  } else {
    console.group(prefix);
  }
}

export const logger = {
  log(
    { prefix, envKey, defaultDo, skipCheck }: LogOption,
    name: string,
    ...contents: any[]
  ) {
    if (skipCheck || shouldLog({ prefix, envKey, defaultDo })) {
      console.log(`[${prefix}]${name}:`, ...contents);
    }
  },
  logMultiLines(
    { prefix, envKey, defaultDo, skipCheck }: LogOption,
    contentPairs: LogContentPairs,
  ) {
    if (IS_NOT_PRODUCTION) {
      const fixedEnvKey = getFixedEnvKey(prefix, envKey);
      if (skipCheck || shouldLog({ prefix, envKey: fixedEnvKey, defaultDo })) {
        groupStart(prefix, fixedEnvKey);
        contentPairs.forEach(([name, ...contents]) =>
          console.log(`${name}:`, ...contents),
        );
        console.groupEnd();
      }
    }
  },
  logFn(
    { prefix, envKey, defaultDo, skipCheck }: LogOption,
    name: string,
    contentsFn: () => any[],
  ) {
    if (skipCheck || shouldLog({ prefix, envKey, defaultDo })) {
      console.log(`[${prefix}]${name}:`, ...contentsFn());
    }
  },
  logMultiLinesFn(
    { prefix, envKey, defaultDo, skipCheck }: LogOption,
    contentPairsFn: () => LogContentPairs,
  ) {
    if (IS_NOT_PRODUCTION) {
      const fixedEnvKey = getFixedEnvKey(prefix, envKey);
      if (skipCheck || shouldLog({ prefix, envKey: fixedEnvKey, defaultDo })) {
        groupStart(prefix, fixedEnvKey);
        contentPairsFn().forEach(([name, ...contents]) =>
          console.log(`${name}:`, ...contents),
        );
        console.groupEnd();
      }
    }
  },
};
