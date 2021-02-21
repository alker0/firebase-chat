import { JSX } from 'solid-js';

export type OnlyRequired<T extends object> = {
  [K in keyof T]: T[K] extends undefined ? never : T[K];
};

export type OnlyOptional<T extends object> = Pick<
  T,
  Exclude<
    {
      [K in keyof T]: T extends Record<K, T[K]> ? never : K;
    }[keyof T],
    undefined
  >
>;

export type RequiredSwitch<
  T extends object,
  U extends string
> = {} extends OnlyRequired<T> ? { [K in U]?: T } : { [K in U]: T };

export type NativeHandlerOf<
  T extends JSX.EventHandlerUnion<any, any> | undefined
> = NonNullable<T> extends JSX.EventHandlerUnion<infer V, infer W>
  ? JSX.EventHandler<V, W>
  : never;

export type EventArg<
  T extends HTMLElement = HTMLElement,
  U extends Event = Event
> = Parameters<JSX.EventHandler<T, U>>[0];

export type EventArgOf<T> = NonNullable<T> extends JSX.EventHandlerUnion<
  infer U,
  infer V
>
  ? EventArg<U, V>
  : never;
