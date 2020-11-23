#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const cwd = process.cwd();

const srcDir = path.join(process.cwd(), 'src');

const appDir = path.join(srcDir, 'app');
const templateDir = path.join(srcDir, 'templates');
const styleDir = path.join(srcDir, 'styles');

const templateExtension = '.posthtml';
const styleExtension = '.pcss';
const scriptExtension = '.tsx';
const skipExtension = '.skip';

const args = process.argv.slice(2);

// Console format
const red = '\x1b[31m%s\x1b[0m';
const green = '\x1b[32m%s\x1b[0m';
const cyan = '\x1b[36m%s\x1b[0m';
const normal = '%s';
const greenNormal = `${green}${normal}`;
const cyanNormal = `${cyan}${normal}`;

// Check exist required targets
(async () => {
  await Promise.all(
    [
      { target: path.join(cwd, 'package.json'), msg: 'Not Project Root' },
      { target: appDir, msg: 'Not Found "app" Directory' },
      { target: templateDir, msg: 'Not Found "templates" Directory' },
      { target: styleDir, msg: 'Not Found "styles" Directory' },
    ].map(({ target, msg }) => {
      return (async () => {
        try {
          await fs.access(target);
        } catch (err) {
          if (err.code === 'ENOENT') err.message = msg;

          throw err;
        }
      })();
    }),
  );

  if (args.length < 1) throw new Error('No Targets');

  const successLog = (messageInfo) => {
    const [messages, formats] = messageInfo;
    console.log(formats, ...messages);
  };

  const alert = (error) => {
    console.error(red, error);
  };

  const relative = (to) => {
    return path.relative(cwd, to);
  };

  const catchExistItem = async (err, itemPath, typeCheck, itemTypeText) => {
    if (err.code === 'EEXIST') {
      if (typeCheck(await fs.lstat(itemPath))) {
        successLog([
          ['Skip', ` Creating ${itemPath} <= It is already exists`],
          cyanNormal,
        ]);
        return;
      }

      // eslint-disable-next-line no-param-reassign
      err.message = `Non ${itemTypeText} item is exist on '${itemPath}'`;
    }
    throw err;
  };

  const touch = async (itemPath, successMsgInfo) => {
    try {
      await fs.writeFile(itemPath, '', { flag: 'wx' });
      successLog(successMsgInfo);
    } catch (err) {
      catchExistItem(err, itemPath, (stats) => stats.isFile(), 'file');
    }
  };

  const createSymlink = async (target, itemPath, successMsgInfo) => {
    try {
      await fs.symlink(target, itemPath);
      successLog(successMsgInfo);
    } catch (err) {
      catchExistItem(
        err,
        itemPath,
        (stats) => stats.isSymbolicLink(),
        'symLink',
      );
    }
  };

  const afterAllSettled = (results, successMsgInfo) => {
    const [, errors] = results.reduce(
      (accum, result) => {
        accum[result.status === 'fulfilled' ? 0 : 1].push(result);
        return accum;
      },
      [[], []],
    );
    if (!errors.length) {
      successLog(successMsgInfo);
    } else {
      errors.forEach((error) => alert(error.reason));
    }
  };

  const allResults = await Promise.allSettled(
    args.map((name) =>
      (async () => {
        // src/app/name
        const targetDir = path.join(appDir, name);

        try {
          await fs.mkdir(targetDir);
          successLog([['Create', ` Page Dir : ${targetDir}`], greenNormal]);
        } catch (err) {
          catchExistItem(
            err,
            targetDir,
            (stats) => stats.isDirectory(),
            'directory',
          );
        }

        // src/app/name/name
        const targetBasePath = path.join(targetDir, name);

        // src/templates/name.ext
        const targetTemplatePath = path.join(
          templateDir,
          name + templateExtension,
        );

        const createTemplateFile = touch(targetTemplatePath, [
          ['Create', ` Template File : ${relative(targetTemplatePath)}`],
          greenNormal,
        ]);

        // src/styles/name.ext
        const targetStylePath = path.join(styleDir, name + styleExtension);

        const createStyleFile = touch(targetStylePath, [
          ['Create', ` Style File : ${relative(targetStylePath)}`],
          greenNormal,
        ]);

        // src/app/name/name.ext
        const targetScriptPath = targetBasePath + scriptExtension;

        const createScriptFile = touch(targetScriptPath, [
          ['Create', ` Script File : ${relative(targetScriptPath)}`],
          greenNormal,
        ]);

        // src/app/name/ to src/template/name.ext
        const relativeToTemplate = path.relative(targetDir, targetTemplatePath);

        // src/app/name/ to src/style/name.ext
        const relativeToStyle = path.relative(targetDir, targetStylePath);

        // src/app/name/name.skip.ext
        const templateLinkPath = `${targetBasePath}${skipExtension}.html`;
        const styleLinkPath = `${targetBasePath}${skipExtension}.css`;

        // src/app/name/name.ext.skip -> src/template/name
        const createTemplateLink = createTemplateFile.then(() => {
          return createSymlink(relativeToTemplate, templateLinkPath, [
            [
              'Create',
              ` Template Link : ${relative(
                templateLinkPath,
              )} -> ${relativeToTemplate}`,
            ],
            greenNormal,
          ]);
        });

        // src/app/name/name.ext.skip -> src/styles/name
        const createStyleLink = createStyleFile.then(() => {
          return createSymlink(relativeToStyle, styleLinkPath, [
            [
              'Create',
              ` Script Link : ${relative(styleLinkPath)} -> ${relativeToStyle}`,
            ],
            greenNormal,
          ]);
        });

        const results = await Promise.allSettled([
          createScriptFile,
          createTemplateLink,
          createStyleLink,
        ]);

        afterAllSettled(results, [
          [`\nCreating '${name}' Page Is Completed`],
          green,
        ]);
      })(),
    ),
  );

  afterAllSettled(allResults, [
    ['\nCreating All Requested Page Is Completed\n'],
    green,
  ]);
})();