import { createRoot } from "solid-js";
import { css } from "styled-jsx/css";

export const createDisposableStyle = (cssResolve: () => { className: string, styles: string, }) =>
  createRoot(dispose => ({
    className: cssResolve().className,
    dispose
  }));

export type OnlyWrap = 'only wrap style';

export const onlyWrap = createRoot(() => css.resolve`
  * {
    display: contents
  }
`).className as OnlyWrap;
