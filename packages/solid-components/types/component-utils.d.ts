export type OnlyOptional<T extends object> = Pick<
  T,
  Exclude<
    {
      [K in keyof T]: T extends Record<K, T[K]> ? never : K;
    }[keyof T],
    undefined
  >
>;

export type NativeHandlerOf<
  T extends JSX.EventHandlerUnion<unknown, unknown> | undefined
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

export interface ComponentMemo {
  Memo: JSX.FunctionElement;
}
