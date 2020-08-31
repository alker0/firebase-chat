import { createRoot } from "solid-js";
import { css } from "styled-jsx/css";

export type OnlyWrap = 'only wrap style'

export const onlyWrap = createRoot(() => css.resolve`
  * {
    display: contents
  }
`).className as OnlyWrap

