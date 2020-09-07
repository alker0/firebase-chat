import 'solid-js';

declare module 'solid-js' {

  type Head<T extends any[], D = never> = T extends [infer X, ...any[]] ? X : D;
  type Tail<T extends any[]> = ((...x: T) => void) extends ((x: any, ...xs: infer XS) => void) ? XS : never;

  type Aggregate<T extends any[] = []> = {
    invalid: never,
    aggregate: Head<T> & Aggregate<Tail<T>>,
    result: Head<T>,
  }[T extends [any, any, ...any[]] ? "aggregate"
    : T extends [any] ? "result"
    : "invalid"];

  export const assignProps: <T extends any[]>(...args: T) => Aggregate<T>;
}

import 'solid-js/types/rendering/jsx';

declare global {
  namespace JSX {
    interface HTMLAttributes<T> extends DOMAttributes<T> {
      role?: string,
    }
  }
}

