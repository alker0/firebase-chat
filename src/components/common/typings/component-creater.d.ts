import { Component, lazy } from "solid-js";

export interface ComponentCreater<S, T = unknown> {
  createComponent: ((context: S) => Component<T>) extends (context: undefined) => infer R
  ? (context?: S) => R
  : (context: S) => Component<T>,
}

export type DefaultComponents<T, U> = Required<{
  [K in keyof T]: Component<U[K]>
}>;
