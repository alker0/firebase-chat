const extend = require('posthtml-extend')
const expressoins = require('posthtml-expressions')
const include = require('posthtml-include')

const nodeEnv = process.env['NODE_ENV']

console.error('posthtml.config.js', nodeEnv)

module.exports = {
  input: 'src/templates/*.html',
  plugins: [
    extend({root: 'src/templates'}),
    include({root: 'src/templates'}),
    expressoins({locals: {
      env: nodeEnv,
      cirrusVersion: '@0.5.5',
      firebaseVersion: '7.17.1',
      firebaseInitPath: '/lib/firebase-init-app.js',
      firebaseSdk: ['analytics', 'auth', 'database', 'storage']
    }}),
  ],
}
