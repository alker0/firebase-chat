#!/usr/bin/env node

const http = require('http');
const stream = require('stream');
const connect = require('connect'); // npm package
const websocket = require('websocket-driver'); // npm package
const superstatic = require('superstatic'); // npm package
const firebaseConfig = require('firebase-tools/lib/config').load({
  cwd: process.cwd(),
});

const httpPrefix = 'http://';
const websocketPrefix = 'ws://';

function createProxyProvider({ resourceEndPoint, logger }) {
  return (_req, path) => {
    const resourceUrl = httpPrefix + resourceEndPoint + path;
    const passThrough = new stream.PassThrough();

    return new Promise((resolve, reject) => {
      if (websocket.isWebSocket(_req)) resolve(null);
      // if(websocket.isWebSocket(_req)) {
      //   _req.url = path
      //   _req.headers.origin = websocketPrefix + resourceEndPoint

      //   const wsDriver = websocket.http(_req, {protocols: wsProtocols})

      //   _req.socket.pipe(wsDriver.io).pipe(_req.socket)

      //   wsDriver
      //   .on('error', reject)
      //   .on('open', () => {
      //     logger.log('Websocket Open')
      //     resolve({ stream: wsDriver.io, size: '', etag: '', modified: '' })
      //   })
      //   .on('message', (ev) => {
      //     logger.log(Object.keys(ev))
      //   })
      //   .on('close', () => logger.log('Websocket Close'))

      //   wsDriver.start()

      //   return;
      // }

      http
        .request(resourceUrl)
        .on('error', reject)
        .on('response', (res) => {
          if (res.statusCode !== 200) {
            resolve(null);
            logger.error(
              [`StatusCode: ${res.statusCode}`, `Path: ${resourceUrl}`].join(
                '\n',
              ),
            );
            return;
          }

          const size = res.headers['content-length'];
          const { etag, date } = res.headers;
          resolve({ stream: passThrough, size, etag, modified: date });
          res.pipe(passThrough);
        })
        .end();
    });
  };
}

const sigint = 'SIGINT';

const localhost = 'localhost';

module.exports = ({
  resourceEndPoint,
  port,
  logger: loggerArg,
  protocols = [],
}) => {
  const logger = loggerArg || console;

  const proxyEndPoint = `${localhost}:${port}`;

  const app = connect();

  app.use((req, res, next) => {
    if (websocket.isWebSocket(req)) {
      req.headers.host = resourceEndPoint;
      req.headers.origin = websocketPrefix + resourceEndPoint;

      // const wsDriver = websocket.http(req)
      const wsDriver = websocket.http(req, { protocols });

      req.socket.pipe(wsDriver.io).pipe(req.socket);

      wsDriver
        .on('error', () => logger.error('Error'))
        .on('open', () => {
          logger.log('Websocket Open');
        })
        .on('message', (ev) => {
          logger.log(Object.keys(ev));
        })
        .on('close', () => logger.log('Websocket Close'));

      wsDriver.start();
    } else {
      next();
    }
  });

  app.use(
    superstatic({
      config: firebaseConfig.data.hosting,
      provider: createProxyProvider({
        resourceEndPoint,
        logger,
      }),
    }),
  );

  const server = app.listen(port, () => {
    logger.log(
      [
        'Superstatic proxy is running',
        `Resource(${resourceEndPoint}) <-> Proxy(${proxyEndPoint}) <-> Browser`,
      ].join('\n'),
    );
  });

  // server.on('upgrade', function(req, socket, body){
  //   if(!websocket.isWebSocket(req)) return;
  //   logger.log('Upgrade')
  //   logger.log(req.headers.host)
  //   logger.log(req.headers.origin)

  //   req.headers.host = resourceEndPoint
  //   req.headers.origin = websocketPrefix + resourceEndPoint

  //   // const wsDriver = websocket.http(req)
  //   const wsDriver = websocket.http(req, {protocols})

  //   wsDriver.io.write(body)

  //   socket.pipe(wsDriver.io).pipe(socket)

  //   wsDriver
  //     .on('error', logger.error)
  //     .on('open', () => {
  //       logger.log('Websocket Open');
  //     })
  //     .on('message', (ev) => {
  //       logger.log(Object.keys(ev));
  //     })
  //     .on('close', () => logger.log('Websocket Close'));

  //   wsDriver.start()
  // })

  const closer = () => {
    server.close(() => {
      logger.log(
        ['', '======== SIGINT ========', 'Proxy server is closed'].join('\n'),
      );
    });

    process.off(sigint, closer);
    process.kill(process.pid, sigint);
  };

  process.on(sigint, closer);
};
