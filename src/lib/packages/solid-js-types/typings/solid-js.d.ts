import 'solid-js';
import 'solid-js/types/rendering/jsx';

declare module 'solid-js' {
  type Head<T extends any[], D = never> = T extends [infer X, ...any[]] ? X : D;
  type Tail<T extends any[]> = ((...x: T) => void) extends (
    x: any,
    ...xs: infer XS
  ) => void
    ? XS
    : never;

  type Aggregate<T extends any[] = []> = {
    invalid: never;
    aggregate: Head<T> & Aggregate<Tail<T>>;
    result: Head<T>;
  }[T extends [any, any, ...any[]]
    ? 'aggregate'
    : T extends [any]
    ? 'result'
    : 'invalid'];

  export const assignProps: <T extends any[]>(...args: T) => Aggregate<T>;
  export declare function createComputed<T>(fn: (v?: T) => T, value?: T): void;
}

declare global {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface HTMLAttributes<T> extends DOMAttributes<T> {
      role?: string;
    }
  }
}
