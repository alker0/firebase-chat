#!/usr/bin/env node

const http = require('http')
const stream = require('stream')
const connect = require('connect')// npm package
const websocket = require('websocket-driver')// npm package

const superstatic = require('superstatic')// npm package
const firebaseConfig = require('firebase-tools/lib/config').load({ cwd: process.cwd() })

function createProxyProvider(endPoint) {
    return (_req, path) => {
        const resourcePath = endPoint + path
        const passThrough = new stream.PassThrough()
        return new Promise((resolve, reject) => {
            http.request(resourcePath)
            .on('error', reject)
            .on('response', (res) => {
                if (res.statusCode != 200) {
                    resolve(null)
                    console.error([
                      `StatusCode: ${res.statusCode}`,
                      `Path: ${resourcePath}`
                    ].join('\n'))
                    return
                }

                const size = res.headers['content-length']
                const etag = res.headers['etag']
                const date = res.headers['date']
                resolve({ stream: passThrough, size, etag, modified: date })
                res.pipe(passThrough)
            })
            .end()
        })
    }
}

const localhost = 'localhost'
const args =  process.argv.slice(2)
let port = 8081
let resourceEndPoint = `${localhost}:8080`

while(args.length){
  const arg = args.shift()
  switch (arg) {
    case '-r':
    case '--resource':
      resourceEndPoint = args.shift()
      break
    case '-p':
    case '--port':
      port = args.shift()
      break
  }
}

const httpPrefix = 'http://'

const app = connect()

app.use(superstatic({
    config: firebaseConfig.data.hosting,
    provider: createProxyProvider(httpPrefix + resourceEndPoint)
}))

const server = app.listen(port, () => {
    console.log(['Superstatic proxy is running',
     `Resource(${resourceEndPoint}) <-> Proxy(${localhost}:${port}) <-> Browser`
    ].join('\n'))
})

server.on('upgrade', function(req, socket, body){
    if(!websocket.isWebSocket(req)) return

    // req.headers.host = proxyBase

    const wsDriver = websocket.http(req)
    // const wsDriver = websocket.http(req, {protocols: ['esm-hmr']})

    wsDriver.io.write(body)
    socket.pipe(wsDriver.io).pipe(socket)

    wsDriver.start()
})