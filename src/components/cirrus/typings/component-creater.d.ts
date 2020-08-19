import { Component } from "solid-js";

export interface ComponentCreater<S, T = unknown, U = unknown> {
  createComponent: (context?: S) => (Component<T> & U)
}
