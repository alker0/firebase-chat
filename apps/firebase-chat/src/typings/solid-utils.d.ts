import { State } from 'solid-js';

export type FromState<T> = T extends State<infer R> ? R : never;

export interface LoadingObject<T> {
  loading: Record<keyof T, boolean>;
}

export type ResourceState<T> = State<T & LoadingObject<T>>;

export type StateOrResource<T> = State<T & Partial<LoadingObject<T>>>;
