const proxy = require('../scripts/firebase-proxy-core')

module.exports = function(snowpackConfig, pluginOption) {
  return {
    name: 'firebase-proxy',
    async run({isDev, log}) {
      if(!isDev) return

      const logger = {
        log: (...msg) => log('WORKER_MSG', {level: 'log', msg: msg.join(' ')}),
        error: (...msg) => log('WORKER_MSG', {level: 'error', msg: msg.join(' ')}),
      }

      const proxyOption = {
        resourceEndPoint: 'localhost:8080',
        port: 8081,
        logger: logger,
        ...(pluginOption ? pluginOption : {})
      }

      proxy(proxyOption)
    }
  }
}
