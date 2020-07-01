#!/usr/bin/env node

const fs = require('fs').promises
const path = require('path')

const cwd = process.cwd()

const srcDir = path.join(process.cwd(), 'src')

const appDir = path.join(srcDir, 'app')
const templateDir = path.join(srcDir, 'templates')
const styleDir = path.join(srcDir, 'styles')

const templateExtension = '.sqrl'
const styleExtension = '.styl'

const args = process.argv.slice(2)

const red = '\x1b[31m%s\x1b[0m'
const green = '\x1b[32m%s\x1b[0m'
const normal = '%s'
const redNormal = `${red}${normal}`

// Check exist required targets
;(async function () {
  await Promise.all(
    [
      { target: path.join(cwd, 'package.json'), msg: 'Not Project Root' },
      { target: appDir, msg: 'Not Found "app" Directory' },
      { target: templateDir, msg: 'Not Found "templates" Directory' },
      { target: styleDir, msg: 'Not Found "styles" Directory' },
    ].map(({ target, msg }) => {
      return (async () => {
        try {
          await fs.access(target)
        } catch (err) {
          if (err.code === 'ENOENT') err.message = msg
          throw err
        }
      })()
    })
  )

  if (args.count < 1) throw new Error('No Targets')

  const successLog = function (messageInfo) {
    [messages, formats] = messageInfo
    console.log(formats, ...messages)
  }

  const alert = function (error) {
    console.error(red, error)
  }

  const relative = function (to) {
    return path.relative(cwd, to)
  }

  const afterAllSettled = function (results, successMsgInfo) {
    const [successes, errors] = results.reduce(
      (accum, result) => {
        accum[result.status == 'fulfilled' ? 0 : 1].push(result)
        return accum
      },
      [[], []]
    )
    if (!errors.length) {
      successLog(successMsgInfo)
    } else {
      errors.forEach((error) => alert(error.reason))
    }
  }

  const allResults = await Promise.allSettled(
    args.map((name) =>
      (async () => {
        // src/app/name
        const targetDir = path.join(appDir, name)

        // delete src/app/name
        const deletePageDir = fs
          .rmdir(targetDir, { recursive: true })
          .then(() =>
            successLog([
              ['Delete', ` Page Dir : ${relative(targetDir)}`],
              redNormal,
            ])
          )

        // src/templates/name.ext
        const targetTemplatePath = path.join(
          templateDir,
          name + templateExtension
        )

        // delete src/templates/name.ext
        const deleteTemplateFile = fs
          .unlink(targetTemplatePath)
          .then(() =>
            successLog([
              ['Delete', ` Template File : ${relative(targetTemplatePath)}`],
              redNormal,
            ])
          )

        // src/styles/name.ext
        const targetStylePath = path.join(styleDir, name + styleExtension)

        // delete src/styles/name.ext
        const deleteStyleFile = fs
          .unlink(targetStylePath)
          .then(() =>
            successLog([
              ['Delete', ` Style File : ${relative(targetStylePath)}`],
              redNormal,
            ])
          )

        const results = await Promise.allSettled([
          deletePageDir,
          deleteTemplateFile,
          deleteStyleFile,
        ])

        afterAllSettled(results, [[`\nDeleting '${name}' Page Is Completed`], green])
      })()
    )
  )
  afterAllSettled(allResults, [['\nDeleting All Requested Page Is Completed\n'], green])
 })()
