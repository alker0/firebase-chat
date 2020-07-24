const nodeEnv = process.env['NODE_ENV']
const dev = 'development'

console.log('posthtml.config.js', nodeEnv)

let firebasePath
// switch (nodeEnv) {
switch (dev) {
  case 'production':
    firebasePath = '/__/firebase'
    break
  case 'development':
    firebasePath = 'https://www.gstatic.com/firebasejs'
    break
  default:
    break
}

module.exports = {
  plugins: {
    'posthtml-extend': {root: 'src/templates'},
    'posthtml-include': {root: 'src/templates'},
    'posthtml-expressions': {locals: {
      // env: nodeEnv,
      env: dev,
      infernoVersion: '@latest',
      cirrusVersion: '@0.5.5',
      ferpVersion: '@1.2.0',
      firebasePath: firebasePath,
      firebaseInitPath: './src/lib/firebase-init-app.js',
      firebaseVersion: '7.17.0',
      firebaseSdk: ['analytics', 'database', 'storage']
    }}
  }
}
