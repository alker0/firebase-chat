#!/usr/bin/env node

const http = require('http')
const stream = require('stream')
const connect = require('connect')// npm package
const websocket = require('websocket-driver')// npm package
const superstatic = require('superstatic')// npm package
const firebaseConfig = require('firebase-tools/lib/config').load({ cwd: process.cwd() })

function createProxyProvider({endPoint, logger}) {
  return (_req, path) => {
    const resourcePath = endPoint + path
    const passThrough = new stream.PassThrough()
    return new Promise((resolve, reject) => {
      http.request(resourcePath)
      .on('error', reject)
      .on('response', (res) => {
        if (res.statusCode != 200) {
          resolve(null)
          logger.error([
            `StatusCode: ${res.statusCode}`,
            `Path: ${resourcePath}`
          ].join('\n'))
          return;
        }

        const size = res.headers['content-length']
        const {etag, date} = res.headers
        resolve({ stream: passThrough, size, etag, modified: date })
        res.pipe(passThrough)
      })
      .end()
    })
  }
}

const sigint = 'SIGINT'

const localhost = 'localhost'
const httpPrefix = 'http://'

module.exports = ({resourceEndPoint, port, logger}) => {
  logger = logger || console

  const proxyEndPoint = `${localhost}:${port}`

  const app = connect()

  app.use(superstatic({
      config: firebaseConfig.data.hosting,
      provider: createProxyProvider({
        endPoint: httpPrefix + resourceEndPoint,
        logger: logger
      })
  }))

  const server = app.listen(port, () => {
    logger.log(['Superstatic proxy is running',
    `Resource(${resourceEndPoint}) <-> Proxy(${proxyEndPoint}) <-> Browser`
    ].join('\n'))
  })

  server.on('upgrade', function(req, socket, body){
    if(!websocket.isWebSocket(req)) return;

    // req.headers.host = proxyBase

    // const wsDriver = websocket.http(req)
    const wsDriver = websocket.http(req, {protocols: ['esm-hmr']})

    wsDriver.io.write(body)
    socket.pipe(wsDriver.io).pipe(socket)

    wsDriver.start()
  })

  const closer = () => {
    server.close(() => {
      logger.log([
        '',
        '======== SIGINT ========',
        'Proxy server is closed',
      ].join('\n'))
    })

    process.off(sigint, closer)
    process.kill(process.pid, sigint)
  }

  process.on(sigint, closer)
}
