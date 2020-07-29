// export * as Foo from 'foo'
// ↑ not working

import * as _Ferp from 'https://cdn.skypack.dev/ferp@^1.2.0'
export const Ferp = _Ferp

// import * as _Inferno from 'https://cdn.skypack.dev/inferno@^7.4.2'
import * as _Inferno from 'inferno'
export const Inferno = _Inferno

export { default as clsx } from "https://cdn.skypack.dev/clsx@^1.1.1";
