import { Component } from 'solid-js';

export interface ComponentCreater<S, T = unknown> {
  createComponent: ((context: S) => Component<T>) extends (
    context: undefined,
  ) => infer R
    ? (context?: S) => R
    : (context: S) => Component<T>;
}

export type DefaultComponents<T, U> = Required<
  {
    [K in keyof T]: Component<U[K]>;
  }
>;

export type OnlyOptional<T extends object> = Pick<
  T,
  Exclude<
    {
      [K in keyof T]: T extends Record<K, T[K]> ? never : K;
    }[keyof T],
    undefined
  >
>;
