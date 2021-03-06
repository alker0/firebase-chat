import { css } from 'styled-jsx/css';
import { createRoot } from 'solid-js';

export interface CSSResolveResult {
  className: string;
  styles: string;
}

export interface DisposableStyle {
  className: string;
  dispose: () => void;
}

export const createDisposableStyle = <T extends string>(
  cssResolve: () => CSSResolveResult,
) =>
  createRoot((dispose) => ({
    className: cssResolve().className as T,
    dispose,
  }));

export const createMultiDisposableStyle = <
  T extends string,
  U extends T[] = T[]
>(
  cssResolves: () => CSSResolveResult[],
) =>
  createRoot((dispose) => ({
    classNames: cssResolves().map((resolved) => resolved.className) as U,
    dispose,
  }));

export interface StyleRegistry
  extends Partial<Record<string, DisposableStyle>> {}

function registerStyle<T extends StyleRegistry, U extends string>(
  registry: T,
  key: U,
  cssResolve: () => CSSResolveResult,
): asserts registry is T & Record<U, DisposableStyle> {
  if (registry[key]) return;

  const { className, dispose } = createDisposableStyle(cssResolve);

  Object.defineProperty(registry, key, {
    value: {
      className,
      dispose: () => {
        dispose();
        // eslint-disable-next-line no-param-reassign
        delete registry[key];
      },
    },
    configurable: true,
    enumerable: true,
  });
}

export const styleUtils = {
  registry: {} as StyleRegistry,

  registerAndGet<T extends string>(
    key: T,
    cssResolve: () => CSSResolveResult,
  ): DisposableStyle {
    registerStyle(styleUtils.registry, key, cssResolve);

    return styleUtils.registry[key];
  },

  onlyWrap: () =>
    styleUtils.registerAndGet(
      'onlyWrap',
      () => css.resolve`
        * {
          display: contents;
        }
      `,
    ),
  pointerCursor: () =>
    styleUtils.registerAndGet(
      'pointerCursor',
      () => css.resolve`
        * {
          cursor: pointer;
        }
      `,
    ),
};
