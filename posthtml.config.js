const extend = require('posthtml-extend')
const expressoins = require('posthtml-expressions')
const include = require('posthtml-include')

const nodeEnv = process.env['NODE_ENV'] || 'development'

const isProd = nodeEnv === 'production'

console.error('posthtml.config.js', nodeEnv)

module.exports = {
  input: 'src/templates/*.posthtml',
  plugins: [
    extend({root: 'src/templates'}),
    include({root: 'src/templates'}),
    expressoins({locals: {
      env: nodeEnv,
      cirrusVersion: '@0.5.5',
      firebaseVersion: '7.19.0',
      firebaseInitPath: '/lib/firebase-init-app.js',
      firebaseSdk: ['auth', 'database', 'storage'],
      useAnalytics: true,
      firebaseAnalyticsPath: '/lib/firebase-init-analytics.js',
      useFirebaseUI: true,
      firebaseUIVersion: '3.5.2'
    }}),
  ],
}
