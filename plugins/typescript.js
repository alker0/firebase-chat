#!/usr/bin/env node

const ts = require('typescript')
const { promises: fs } = require('fs')

module.exports = function plugin() {
  const tsconfig = fs
    .readFile('tsconfig.json', { encoding: 'utf-8' })
    .then(
      source => ts.parseConfigFileTextToJson('tsconfig.json', source).config
    )

  return {
    defaultBuildScript: 'build:ts,tsx',

    async build({ filePath, contents }) {
      if (filePath.endsWith(".d.ts")) return

      const { compilerOptions } = await tsconfig

      const result = ts.transpile(contents, compilerOptions, filePath)
      return { result }
    }
  }

}
