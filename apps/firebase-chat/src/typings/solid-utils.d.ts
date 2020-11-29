import { State } from 'solid-js';

export type FromState<T> = T extends State<infer R> ? R : never;
