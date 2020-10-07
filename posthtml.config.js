const extend = require('posthtml-extend');
const expressoins = require('posthtml-expressions');
const include = require('posthtml-include');
const packagesInfo = require('./package.json');

const nodeEnv = process.env.NODE_ENV || 'development';

console.error('posthtml.config.js', nodeEnv);

const devDeps = packagesInfo.devDependencies;

const onlyVersion = (semVer) => semVer.replace(/[^\d.]/, '');

const firebaseInitPath =
  nodeEnv === 'production'
    ? '/__/firebase/init.js'
    : '/lib/firebase-init-app.js';

module.exports = {
  input: 'src/templates/*.posthtml',
  plugins: [
    extend({ root: 'src/templates' }),
    include({ root: 'src/templates' }),
    expressoins({
      locals: {
        mode: nodeEnv,
        cirrusVersion: '@0.5.5',
        firebaseVersion: onlyVersion(devDeps.firebase),
        firebaseInitPath,
        firebaseSdk: ['auth', 'database', 'storage'],
        useAnalytics: true,
        firebaseUIVersion: '3.5.2',
        firebaseConfig: {
          apiKey: 'AIzaSyCUDlFQJZdo3NOIAHSt8NmgF-gOHQ9ZkHg',
          authDomain: 'talker-v1.firebaseapp.com',
          // databaseURL: 'https://talker-v1.firebaseio.com',
          databaseURL: 'http://localhost:9000',
          projectId: 'talker-v1',
          storageBucket: 'talker-v1.appspot.com',
          messagingSenderId: '578515840439',
          appId: '1:578515840439:web:2b7905e64ae01d07778c32',
          measurementId: 'G-S42EYX1LN4',
        },
      },
    }),
  ],
};
