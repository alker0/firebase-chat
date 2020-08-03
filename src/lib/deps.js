// export * as Foo from 'foo'
// ↑ not working

import * as _Ferp from 'https://cdn.skypack.dev/ferp@^1.2.0/src/ferp.js'
export const Ferp = _Ferp

// import * as _Inferno from 'https://cdn.skypack.dev/inferno@^7.4.2'
import {render, Component} from 'inferno'
export const Inferno = { render, Component }

export { default as clsx } from "https://cdn.skypack.dev/clsx@^1.1.1/dist/clsx.m.js"
