const proxy = require('../scripts/firebase-proxy-core')

const warnMark = '❗'
const warnMsg = messages => {
  return messages.map(msg => {
    return msg.split('\n').map(line => `${warnMark} ${line}`).join('\n')
  }).join(' ')
}

const redCross = '\x1b[31m✘\x1b[0m'
const errorMsg = messages => {
  return messages.map(msg => {
    return msg.split('\n').map(line => `${redCross} ${line}`).join('\n')
  }).join(' ')
}

module.exports = function(snowpackConfig, pluginOption) {
  return {
    name: 'firebase-proxy',
    async run({isDev, log}) {
      if(!isDev) return;

      const logger = {
        log: (...messages) => log('WORKER_MSG', {level: 'log', msg: `${messages.join(' ')}\n`}),
        warn: (...messages) => log('WORKER_MSG', {level: 'warn', msg: `${warnMsg(messages)}\n`}),
        error: (...messages) => log('WORKER_MSG', {level: 'error', msg: `${errorMsg(messages)}\n`}),
      }

      const proxyOption = {
        resourceOrigin: 'localhost:8080',
        port: 8081,
        logger: logger,
        protocols: ['esm-hmr'],
        ...(pluginOption ? pluginOption : {})
      }

      proxy(proxyOption)
    }
  }
}
