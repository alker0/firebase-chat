export const DO_NOTHING = () => {};

export const CONSIDER: <T>(target: unknown) => asserts target is T = DO_NOTHING;

export type TypeCheckText =
  | 'boolean'
  | 'number'
  | 'bigint'
  | 'string'
  | 'symbol'
  | 'object'
  | 'function'
  | 'undefined';

export function checkPropertyTypes<
  T extends {
    [key in keyof T]: TypeCheckText;
  }
>(
  target: Object,
  typeSchema: T,
): target is {
  [key in keyof T]: T[key] extends 'boolean'
    ? boolean
    : T[key] extends 'number'
    ? number
    : T[key] extends 'bigint'
    ? number
    : T[key] extends 'string'
    ? string
    : T[key] extends 'symbol'
    ? symbol
    : T[key] extends 'object'
    ? object
    : T[key] extends 'function'
    ? (...args: any[]) => any
    : T[key] extends 'undefined'
    ? undefined
    : never;
} {
  return Object.keys(typeSchema).every((key) => {
    CONSIDER<keyof typeof target & keyof T>(key);
    return typeof target[key] === typeSchema[key];
  });
}

export function getLastElement<T>(array: T[]) {
  return array.slice(-1)[0];
}
