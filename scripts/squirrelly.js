#!/user/bin/env node

const { promises: fs } = require('fs')
const path = require('path')
const Sqrl = require('squirrelly')

const cwd = process.cwd()

const sqrlExtension = '.sqrl'

const args =  process.argv.slice(2)

const red = '\x1b[31m%s\x1b[0m'
const green = '\x1b[32m%s\x1b[0m'
const normal = '%s'
const greenNormal = `${green}${normal}`;

if(args.Count < 2) throw new Error('Required Least 2 Arguments')

const sqrlOption = Sqrl.getConfig({cache:true})

// Read Arguments

//const includeItems = []

const targets = []

var dist;

while(args.length){
  const arg = args.shift()
  switch (arg) {
    // case '-i':
    // case '--include':
    //   const includePath = args.shift()
    //   if (!includePath) throw new Error('--include <path> required');
    //   includeItems.push(includePath)
    //   break;
    case '-o':
    case '--out':
      dist = args.shift()
      if (!dist) throw new Error('--out <dir> required');
      break;
    default:
      targets.push(arg)
      break;
  }
}

if(!dist) dist = targets.pop()
if(!dist) throw new Error('Missing Output Directory')

// Node Helper

function alert(error) {
  console.error(red, error)
}

function onlyFulFilledValue(results){

  return results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value)
}

async function allFiles(pathName, recursive) {

  stats = await fs.stat(pathName)

  if(stats.isFile()) {
    return [pathName]
  }
  else if(stats.isDirectory()) {

    items = await fs.readdir(pathName, {withFileTypes: true})

    entryFiles = items
      .filter(item => recursive || item.isFile())
      .map(item => allFiles(path.join(pathName, item.name), recursive))

    targetFiles = await Promise.allSettled(entryFiles).then(onlyFulFilledValue)

    return targetFiles.flat().map(fileName => fileName)
  }
  else {
    return []
  }
}

// Render Squirrelly File

async function render(fileName) {

  await fs
    .writeFile(
      path.join(dist, path.basename(fileName, sqrlExtension) + '.html'),
      await Sqrl.renderFile(fileName, sqrlOption)
    )
    .then(() => console.log(greenNormal , 'Renderd', ` : ${path.relative(cwd, fileName)}`))
}

function withExt(fileName) {
  return fileName.endsWith(sqrlExtension) ? fileName : fileName + sqrlExtension
}

// Add Squirrelly Helpers


Sqrl.helpers.define('partial', function (content, blocks, config) {

  // Disallow Blocks And Filters
   if (blocks && blocks.length > 0) {
    throw new Sqrl.SqrlError(/*(native ? 'Native' : '') + */"Helper '" + name + "' doesn't accept blocks")
  }

  const targetPath = withExt(path.join(path.dirname(config.filename), ...content.params[0]))
  const targetConfig = Object.assign({}, config, {filename: targetPath})

  const template = Sqrl.loadFile(targetPath, targetConfig)
  return template(content.params[1] || {}, config)
})

Sqrl.helpers.define('layout', function (content, blocks, config) {
  var data = content.params[1] || {}
  data.content = content.exec()

  for (var i = 0; i < blocks.length; i++) {
    var currentBlock = blocks[i]
    data[currentBlock.name] = currentBlock.exec()
  }

  const targetPath = withExt(path.join(path.dirname(config.filename), ...content.params[0]))
  const targetConfig = Object.assign({}, config, {filename: targetPath})

  const template = Sqrl.loadFile(targetPath, targetConfig)
  return template(data, config)
})

// Check Out Dir

const prepare = (async () => {

  stats = await fs.stat(dist)

  if(!stats.isDirectory()) throw new Error('Output must be directory')
})();

(async function (){

  await prepare

  renderAll = Promise.allSettled(
      targets.map(pathName => allFiles(pathName, false))
    )
    .then(onlyFulFilledValue)
    .then(filesArray => filesArray.flat())
    .then(files => files.filter(name => { return name.endsWith(sqrlExtension)}))
    .then(files => files.forEach(file => render(path.join(cwd, file))))
    .catch(alert)

  await renderAll

})().catch(alert)

