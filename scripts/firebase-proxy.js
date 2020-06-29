#!/usr/bin/env node

const stream = require('stream')
const connect = require('connect')// npm package
const request = require('request')// npm package
const io = require('socket.io')// npm package
const { createProxyMiddleware } = require('http-proxy-middleware')

const superstatic = require('superstatic')// npm package
const firebaseConfig = require('firebase-tools/lib/config').load({ cwd: process.cwd() })

function createProxyProvider(base) {
    return (_req, path) => {
        const proxyPath = base + path
        const passThrough = new stream.PassThrough()
        return new Promise((resolve, reject) => {
            request(proxyPath)
            .on('error', reject)
            .on('response', (res) => {
                if (res.statusCode != 200) {
                    resolve(null)
                    console.error([
                      `StatusCode: ${res.statusCode}`,
                      `Path: ${proxyPath}`
                    ].join('\n'))
                    return
                }

                const size = res.headers['content-length']
                const etag = res.headers['etag']
                const date = res.headers['date']
                resolve({ stream: passThrough, size, etag, modified: date })
                res.pipe(passThrough)
            })
        })
    }
}

const args =  process.argv.slice(2)
let port = 8081
let proxyBase = 'localhost:8080'

while(args.length){
  const arg = args.shift()
  switch (arg) {
    case '-b':
    case '--base':
      proxyBase = args.shift()
      break
    case '-p':
    case '--port':
      port = args.shift()
      break
  }
}

const httpPrefix = 'http://'
const websocketsPrefix = 'ws://'
const wsProxy = createProxyMiddleware(websocketsPrefix + proxyBase, { changeOrigin: true })


const app = connect()

app.use(wsProxy)

app.use(superstatic({
    config: firebaseConfig.data.hosting,
    provider: createProxyProvider(httpPrefix + proxyBase)
}))

const server = app.listen(port, () => {
    console.log(['Superstatic proxy is running',
     `Port: ${port}`,
     `Proxy Base: ${proxyBase}`,
    ].join('\n'))
})

server.on('upgrade', wsProxy.upgrade)


// io.listen(server)
// var listener = io.listen(server);
// listener.sockets.on('connection', function(socket){
//     socket.emit('message', {'message': 'hello world'})
// })
