import { css } from 'styled-jsx/css';
import { createRoot } from 'solid-js';

export const createDisposableStyle = <T extends string>(
  cssResolve: () => { className: string; styles: string },
) =>
  createRoot((dispose) => ({
    className: cssResolve().className as T,
    dispose,
  }));

export const createMultiDisposableStyle = <T extends string[]>(
  cssResolves: () => { [K in keyof T]: { className: T[K]; styles: string } },
) =>
  createRoot((dispose) => ({
    classNames: cssResolves().map((resolved) => resolved.className) as T,
    dispose,
  }));

export type OnlyWrap = 'only wrap style';

export const onlyWrap = createRoot(
  () => css.resolve`
    * {
      display: contents;
    }
  `,
).className as OnlyWrap;

export type PointerCursor = 'pointer cursor style';

export const pointerCursor = createRoot(
  () => css.resolve`
    * {
      cursor: pointer;
    }
  `,
).className as PointerCursor;
