import { State, Resource } from 'solid-js';

export type FromState<T> = T extends State<infer R> ? R : never;

export interface ResourceController<T> {
  mutate: (value: T | undefined) => T | undefined;
  refetch: () => void;
}

export type ResourceWithController<T> = [Resource<T>, ResourceController<T>];
