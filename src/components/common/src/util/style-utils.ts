import { css } from 'styled-jsx/css';
import { createRoot } from 'solid-js';

export const createDisposableStyle = (
  cssResolve: () => { className: string; styles: string },
) =>
  createRoot((dispose) => ({
    className: cssResolve().className,
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
