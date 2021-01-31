const isNotProduction = import.meta.env.MODE !== 'production';

export type LogContentPair = [string, ...any[]];

export type LogContentPairs = LogContentPair[];

export const logger = {
  log(prefix: string, name: string, ...contents: any[]) {
    console.log(`[${prefix}]${name}:`, ...contents);
  },
  logMultiLines(
    prefix: string,
    contentPairs: LogContentPairs,
    collapsed = false,
  ) {
    if (isNotProduction) {
      if (collapsed) {
        console.groupCollapsed(`[${prefix}]`);
      } else {
        console.group(`[${prefix}]`);
      }
      contentPairs.forEach(([name, ...contents]) =>
        console.log(`${name}:`, ...contents),
      );
      console.groupEnd();
    }
  },
  logFn(prefix: string, name: string, contentsFn: () => any[]) {
    console.log(`[${prefix}]${name}:`, ...contentsFn());
  },
  logMultiLinesFn(
    prefix: string,
    contentPairsFn: () => LogContentPairs,
    collapsed = false,
  ) {
    if (isNotProduction) {
      if (collapsed) {
        console.groupCollapsed(`[${prefix}]`);
      } else {
        console.group(`[${prefix}]`);
      }
      contentPairsFn().forEach(([name, ...contents]) =>
        console.log(`${name}:`, ...contents),
      );
      console.groupEnd();
    }
  },
};
