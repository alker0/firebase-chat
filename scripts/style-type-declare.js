const postcss = require('postcss');
const fsSync = require('fs');
const { promises: fs } = fsSync;
const path = require('path');

const classNameDeclarerKey = require.resolve('postcss-ts-classnames');

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.Count < 2) throw new Error('No declare targets');

// Read Arguments

const targets = [];

let typeOutput = path.join(cwd, 'src', 'typings');
let styleOutput = path.join('/dev', 'null');

while (args.length) {
  const arg = args.shift();
  switch (arg) {
    case '-s':
    case '--style-output':
      styleOutput = args.shift();
      if (!styleOutput) throw new Error('--css-output <path> required');
      break;
    case '-t':
    case '--type-output':
      typeOutput = args.shift();
      if (!typeOutput) throw new Error('--type-output <dir> required');
      break;
    default:
      targets.push(arg);
      break;
  }
}

const plugins = [];
const optionalPlugins = ['postcss-import-url', 'postcss-import'];

for (const plugin of optionalPlugins) {
  try {
    plugins.push(require(plugin));
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') throw err;
  }
}

const green = '\x1b[32m%s\x1b[0m';
const normal = '%s';
const greenNormal = `${green}${normal}`;

const singletonKey = 'ts-classname-collector';

const processors = [Promise.resolve('Start')];

function getTypeOutput(target) {
  return path.join(typeOutput, `${path.basename(target, '.css')}.d.ts`);
}

while (targets.length) {
  const target = targets.shift();
  const previous = processors[processors.length - 1];
  const processor = (async () => {
    const css = await fs.readFile(target, { encoding: 'utf-8' });
    return await previous.then(_ => {
      delete global[singletonKey];
      const classNameDeclarer = require(classNameDeclarerKey);
      const targetTypeOutput = getTypeOutput(target);
      return postcss(
        plugins.concat(classNameDeclarer({ dest: targetTypeOutput })),
      )
        .process(css, { from: target, to: styleOutput })
        .then(_ => {
          // console.log(`Exist singleton collector: ${new Boolean(global[singletonKey])}`)
          delete require.cache[classNameDeclarerKey];
          const relativeOutput = path.relative(cwd, targetTypeOutput);
          console.log(greenNormal, 'Scanned', ` : ${relativeOutput}`);
          return new Promise(resolve =>
            setTimeout(resolve, 250, relativeOutput),
          );
        })
        .catch(console.error);
    });
  })();
  processors.push(processor);
}

Promise.allSettled(processors)
  .then(results =>
    results
      .slice(1)
      .filter(
        result =>
          result.status === 'fulfilled' && fsSync.existsSync(result.value),
      )
      .map(result => result.value)
      .forEach(declaredPath =>
        console.log(greenNormal, '🎉 Declared', ` : ${declaredPath}`),
      ),
  )
  .catch(console.error);
