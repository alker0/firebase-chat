const posthtml = require('posthtml');
const fs = require('fs');
const path = require('path');

const fsAsync = fs.promises;
const outputExt = '.html';

const cwd = process.cwd();

module.exports = function postHtmlPlugin(snowpackConfig, pluginOption) {
  const processor = posthtml(pluginOption.config.plugins);

  const inputExt = pluginOption.inputExt || '.posthtml';

  const { inputDir } = pluginOption;

  if (!inputDir) throw new Error('input is required option');

  const outputDir = pluginOption.output || path.resolve(cwd, 'src', 'public');

  return {
    name: 'posthtml',
    resolve: {
      input: [inputExt],
      output: [outputExt],
    },
    async load({ filePath }) {
      throw new Error('PostHTML Plugin: "load" is called');

      // eslint-disable-next-line no-unreachable
      const contents = fs.readFileSync(filePath, 'utf-8');
      const result = await processor.process(contents);
      return {
        '.html': result.html,
      };
    },
    async run({ log }) {
      const items = await fsAsync.readdir(inputDir, { withFileTypes: true });

      const files = items
        .filter((item) => item.isFile())
        .map((item) => ({
          basename: item.name,
          name: path.join(inputDir, item.name),
        }));

      await Promise.all(
        files.map(async ({ basename, name }) => {
          const contents = fs.readFileSync(name, { encoding: 'utf-8' });
          const result = await processor
            .process(contents)
            .then((_result) => _result.html);
          const outputPath = path.join(
            outputDir,
            `${path.basename(name, inputExt)}${outputExt}`,
          );
          const outputRelative = path.relative(cwd, outputPath);
          await fsAsync.writeFile(outputPath, result, { encoding: 'utf-8' });
          log('WORKER_MSG', {
            level: 'log',
            msg: `${basename} has been compiled to ${outputRelative}\n`,
          });
        }),
      );
    },
  };
};
