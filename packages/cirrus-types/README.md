# cirrus-types
[![NPM Version](https://img.shields.io/npm/v/cirrus-types.svg?style=flat)](https://www.npmjs.com/package/cirrus-types)
![](https://img.shields.io/librariesio/release/npm/cirrus-types)
![](https://img.shields.io/npm/dt/cirrus-types.svg?style=flat)

This library is a type declaration of CSS class names in [cirrus-ui](https://github.com/Spiderpig86/Cirrus).

## Usage

Install

```bash
npm install cirrus-types
```

Import

```ts
import { Cirrus } from "cirrus-types";
```

You can also use the type from global.

```ts
import { Cirrus as CirrusClasses } from "cirrus-types";

declare global {
  type Cirrus = CirrusClasses;
}
```
