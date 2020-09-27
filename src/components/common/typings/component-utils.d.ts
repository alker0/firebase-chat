export type OnlyOptional<T extends object> = Pick<
  T,
  Exclude<
    {
      [K in keyof T]: T extends Record<K, T[K]> ? never : K;
    }[keyof T],
    undefined
  >
>;

export interface ComponentMemo {
  Memo: JSX.FunctionElement;
}
