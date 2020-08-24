import { Component } from "solid-js";

export interface ComponentCreater<S, T = unknown, U = unknown> {
  createComponent: (context?: S) => (Component<T> & U)
}

export type LazyComponent<T = unknown> = () => Promise<{ default: Component<T> }>
