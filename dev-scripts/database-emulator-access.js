const { promises: fs } = require('fs');
const path = require('path');
const http = require('http');

const cwd = process.cwd();

const args = process.argv.slice(2);

if (args.length < 2) throw new Error('No declare targets');

// Read Arguments

let httpMethod = 'GET';
const endpointOfEnv = process.env.FIREBASE_DATABASE_EMULATOR_HOST?.split(':');
let [host, port] =
  endpointOfEnv?.length === 2 ? endpointOfEnv : ['localhost', 9000];
let accessPath = '';
const headersArray = [];
let rulesFileArg = path.join(cwd, 'database.rules.json');

let postDataPromise = Promise.resolve('');
while (args.length) {
  const arg = args.shift();
  switch (arg) {
    case '-a':
    case '--admin':
      headersArray.push('Authorization: Bearer owner');
      break;
    case '-d':
    case '--post-data':
      {
        const postData = args.shift();
        if (!postData) throw new Error('--post-data <post-data> required');
        postDataPromise = Promise.resolve(postData);
      }
      break;
    case '-e':
    case '--endpoint':
      [host, port] = args.shift().split(':');
      if (!(host && port)) throw new Error('--endpoint <host:port> required');
      break;
    case '-f':
    case '--post-file':
      {
        const postFile = args.shift();
        if (!postFile) throw new Error('--post-data <post-data> required');
        postDataPromise = fs.readFile(path.resolve(cwd, postFile));
      }
      break;
    case '--headers':
      headersArray.push(args.shift());
      break;
    case '--host':
      host = args.shift();
      if (!host) throw new Error('--host <host> required');
      break;
    case '-m':
    case '--method':
      httpMethod = args.shift();
      if (!httpMethod) throw new Error('--method <http-method> required');
      break;
    case '-p':
    case '--path':
      accessPath = args.shift();
      if (!accessPath) throw new Error('--path <access-path> required');
      break;
    case '--port':
      port = args.shift();
      if (!port) throw new Error('--port <port> required');
      break;
    case '-r':
    case '--rules-file':
      rulesFileArg = args.shift();
      if (!rulesFileArg)
        throw new Error('--rules-file <rules-file-path> required');
      break;
    default:
      break;
  }
}

const url = `http://${host}:${port}${accessPath}`;

const headers = headersArray.reduce((resultHeaders, headersText) => {
  return {
    ...resultHeaders,
    ...Object.fromEntries(
      headersText
        .replace(/;$/, '')
        .replace(/\s*:\s*/, ':')
        .split(';')
        .map((headerText) => {
          return headerText.split(':');
        }),
    ),
  };
}, {});

const req = http
  .request(
    url,
    {
      method: httpMethod,
      headers,
    },
    (res) =>
      res
        .on('error', console.error)
        .on('close', () => {
          console.error('\n\nemulator response is finished.');
        })
        .pipe(process.stdout),
  )
  .on('error', console.error);

(async () => {
  try {
    if (['POST', 'PUT'].includes(httpMethod)) {
      req.write(await postDataPromise);
    }
  } catch (error) {
    console.error(error);
  } finally {
    req.end();
  }
})();
