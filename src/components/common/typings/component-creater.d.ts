import { Component, lazy } from "solid-js";

export interface ComponentCreater<S, T = unknown, U = unknown> {
  createComponent: ((context: S) => (Component<T> & U)) extends (context: undefined) => infer R
    ? (context?: S) => R
    : (context: S) => Component<T> & U
}
