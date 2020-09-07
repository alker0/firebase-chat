#!/usr/bin/env node

const proxy = require('./firebase-proxy-core')

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

proxy({resourceEndPoint, port})
