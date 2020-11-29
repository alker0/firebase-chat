/* eslint-disable import/no-dynamic-require */
import postcss from 'postcss';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import {
  join as pathJoin,
  basename as pathBaseName,
  relative as pathRelative,
} from 'path';
import { createPlugin } from 'postcss-ts-classnames/dist/plugin';
import { ClassNameCollector } from 'postcss-ts-classnames/dist/class-name-collector';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (!args.length) throw new Error('No declare targets');

// Read Arguments

const targets: (string | undefined)[] = [];

let typeOutput = pathJoin(cwd, 'src', 'typings');
let styleOutput = pathJoin('/dev', 'null');

while (args.length) {
  const arg = args.shift();
  switch (arg) {
    case '-s':
    case '--style-output':
      styleOutput = args.shift() ?? styleOutput;
      break;
    case '-t':
    case '--type-output':
      typeOutput = args.shift()!;
      if (!typeOutput) throw new Error('--type-output <dir> required');
      break;
    default:
      targets.push(arg);
      break;
  }
}

function onlyPresent<T extends unknown>(array: T[]) {
  return array.filter((elm) => elm === false || Boolean(elm)) as NonNullable<
    T
  >[];
}

const optionalPlugins = ['postcss-import-url', 'postcss-import'] as const;
const plugins = Promise.all(
  optionalPlugins.map((plugin) =>
    import(plugin).catch((error) => {
      if (error.code !== 'MODULE_NOT_FOUND') throw error;
      return false;
    }),
  ),
).then(onlyPresent);

const green = '\x1b[32m%s\x1b[0m';
const normal = '%s';
const greenNormal = `${green}${normal}`;

// const singletonKey = 'ts-classname-collector';
// declare global {
//   namespace NodeJS {
//     interface Global {
//       [singletonKey]: null;
//     }
//   }
// }

function getTypeOutput(target: string) {
  return pathJoin(typeOutput, `${pathBaseName(target, '.css')}.d.ts`);
}

console.log(onlyPresent(targets));

const processors = onlyPresent(targets).map(async (target) => {
  try {
    const css = await readFile(target, 'utf-8');

    const targetTypeOutput = getTypeOutput(target);

    await postcss(
      (await plugins).concat(
        createPlugin(
          new ClassNameCollector({ dest: targetTypeOutput, isModule: true }),
        ),
      ),
    ).process(css, { from: target, to: styleOutput });

    const relativeOutput = pathRelative(cwd, targetTypeOutput);
    console.log(greenNormal, 'Scanned', ` : ${relativeOutput}`);
    return new Promise<string>((resolve) =>
      setTimeout(() => resolve(targetTypeOutput), 250, relativeOutput),
    );
  } catch (error: unknown) {
    console.error(error);
    throw error;
  }
});

Promise.allSettled(processors).then((results) =>
  results
    .filter(
      (result) => result.status === 'fulfilled' && existsSync(result.value),
    )
    .map((result) => (result as PromiseFulfilledResult<string>).value)
    .forEach((declaredPath) =>
      console.log(greenNormal, '🎉 Declared', ` : ${declaredPath}`),
    ),
);
