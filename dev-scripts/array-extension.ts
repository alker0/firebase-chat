/* eslint-disable no-extend-native */
const propMap = Symbol('propMap');
const methodMap = Symbol('methodMap');
const constructMap = Symbol('constructMap');

Object.defineProperties(Array.prototype, {
  [propMap]: {
    value: {
      [propMap]<T, U extends keyof T>(this: Array<T>, propKey: U) {
        return this.map((element) => element[propKey]);
      },
    }[propMap],
  },
  [methodMap]: {
    value: {
      [methodMap]<
        T,
        U extends keyof T,
        V extends T[U] extends (...args: infer P) => infer R
          ? {
              param: P;
              result: R;
            }
          : never,
        W extends V['param'],
        X extends V['result']
      >(this: Array<T>, methodKey: U) {
        const source = this;
        return function methodMapping(...methodArgs: W) {
          return source.map((element) =>
            ((element[methodKey] as unknown) as (...args: W) => X)(
              ...methodArgs,
            ),
          );
        };
      },
    }[methodMap],
  },
  [constructMap]: {
    value: {
      [constructMap]<T, U>(this: Array<T>, ConstructorFn: new (arg: T) => U) {
        return this.map((element) => new ConstructorFn(element));
      },
    }[constructMap],
  },
});

declare global {
  interface Array<T> {
    [propMap]: <U extends keyof T>(propKey: U) => T[U][];
    [methodMap]: <
      U extends keyof T,
      V extends T[U] extends (...args: any) => any ? T[U] : never,
      W extends Parameters<V>,
      X extends V extends (...args: any) => infer R ? R : never
    >(
      methodKey: U,
    ) => (...methodArgs: W) => X[];
    [constructMap]: <U>(ConstructorFn: new (arg: T) => U) => U[];
  }
}

const srcArray = ['foo', 'bar', 'baz'];
class Nice {
  name: string;

  constructor(text: string) {
    this.name = text;
  }

  echo() {
    return `my name is ${this.name}`;
  }
}

function logInfo(target: unknown) {
  console.log(
    target,
    `[type: ${typeof target}]`,
    `[is array: ${Array.isArray(target)}]`,
  );
}
logInfo(srcArray[propMap]);
logInfo(srcArray[methodMap]);
logInfo(srcArray[constructMap]);
const a = srcArray[propMap]('length');
logInfo(a);
const b = srcArray[methodMap]('toUpperCase');
logInfo(b);
const c = b();
logInfo(c);
const d = srcArray[constructMap](Nice);
logInfo(d);
const e = d[methodMap]('echo')();
logInfo(e);
const f = [srcArray]
  [methodMap](methodMap)('indexOf')
  .map((v) => v('r'));
logInfo(f);
const g = [srcArray, srcArray].map((ae) => ae[methodMap]('indexOf'));
logInfo(g);

export { propMap, methodMap, constructMap };
