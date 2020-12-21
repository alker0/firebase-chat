const posthtml = require('posthtml');
const fsSync = require('fs');
const path = require('path');

const fs = fsSync.promises;
const outputExt = '.html';

const cwd = process.cwd();

module.exports = function postHtmlPlugin(_, pluginOption) {
  const processor = posthtml(pluginOption.config.plugins);

  const {
    inputDir,
    inputExt = '.posthtml',
    outputDir = path.resolve(cwd, 'src', 'public'),
  } = pluginOption;

  if (!inputDir) throw new Error('input is required option');

  function getNowText() {
    const now = new Date();
    const hours = now.getHours();
    return `${hours}:${now.getMinutes()}:${now.getSeconds()} ${
      hours / 12 === 0 ? 'AM' : 'PM'
    }`;
  }

  return {
    name: 'posthtml',
    resolve: {
      input: [inputExt],
      output: [outputExt],
    },
    async load({ filePath, log }) {
      const contents = await fs.readFile(filePath, 'utf-8');
      const result = await processor.process(contents);
      const inputBaseName = path.basename(filePath, inputExt);
      const outputPath = path.join(outputDir, `${inputBaseName}${outputExt}`);
      const outputRelative = path.relative(cwd, outputPath);
      log('WORKER_MSG', {
        level: 'log',
        msg: `${getNowText()} - [Success!] ${inputBaseName} has been compiled to ${outputRelative}\n`,
      });
      return result.html || undefined;
    },
    async run({ log }) {
      const items = await fs.readdir(inputDir, { withFileTypes: true });

      const files = items
        .filter((item) => item.isFile())
        .map((item) => ({
          basename: item.name,
          name: path.join(inputDir, item.name),
        }));

      if (!fsSync.existsSync(outputDir)) {
        await fs.mkdir(outputDir);
      }

      log('WORKER_MSG', {
        level: 'log',
        msg: `${getNowText()} - Starting compilation...\n`,
      });

      let getNotifyPrefix = () => {
        const timePrefix = `${getNowText()} - `;
        const emptyPrefix = Array(timePrefix.length).fill(' ').join('');
        getNotifyPrefix = () => emptyPrefix;
        return `\n${timePrefix}`;
      };

      await Promise.all(
        files.map(async ({ basename, name }) => {
          const contents = await fs.readFile(name, 'utf-8');
          const result = await processor
            .process(contents)
            .then((_result) => _result.html)
            .catch((error) => {
              console.error(`Error in ${name}`);
              throw error;
            });
          const outputPath = path.join(
            outputDir,
            `${path.basename(name, inputExt)}${outputExt}`,
          );
          const outputRelative = path.relative(cwd, outputPath);
          await fs.writeFile(outputPath, result, 'utf-8');
          log('WORKER_MSG', {
            level: 'log',
            msg: `${getNotifyPrefix()}${basename} has been compiled to ${outputRelative}\n`,
          });
        }),
      );
    },
  };
};
