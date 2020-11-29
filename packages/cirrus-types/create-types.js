const { join: pathJoin, relative: pathRelative } = require('path');
const { existsSync } = require('fs');
const { readFile, writeFile } = require('fs/promises');
const postcss = require('postcss');
const importPlugin = require('postcss-import-url');
const declarePlugin = require('postcss-ts-classnames');

const dirName = process.cwd();
const cssPath = pathJoin(dirName, 'cdn', 'cirrus.css');

const typeOutput = pathJoin(dirName, 'tmp', 'index.d.ts');

const green = '\x1b[32m%s\x1b[0m';
const normal = '%s';
const greenNormal = `${green}${normal}`;
const encoding = 'utf-8';

(async () => {
  try {
    const css = await readFile(cssPath, encoding);

    await postcss([
      importPlugin,
      declarePlugin({ dest: typeOutput, isModule: true }),
    ]).process(css, { from: cssPath, to: 'discarded' });

    console.log(
      greenNormal,
      'Processed',
      ` : ${pathRelative(dirName, cssPath)}`,
    );

    await new Promise((resolve) => setTimeout(resolve, 250));

    if (existsSync(typeOutput)) {
      const rawResult = await readFile(typeOutput, encoding);

      const fixedResult = rawResult.replace('ClassNames', 'Cirrus');

      await writeFile(typeOutput, fixedResult, encoding);

      console.log(
        greenNormal,
        'Declared',
        ` : ${pathRelative(dirName, typeOutput)}`,
      );
    } else {
      throw new Error('Failed to create types');
    }
  } catch (error) {
    console.error(error);
  }
})();
