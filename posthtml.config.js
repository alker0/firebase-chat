const extend = require('posthtml-extend');
const expressoins = require('posthtml-expressions');
const include = require('posthtml-include');
const packagesInfo = require('./package.json');

const devDeps = packagesInfo.devDependencies;

const onlyVersion = (semVer) => semVer.replace(/[^\d.]/, '');

const templatePathRootInfo = { root: 'src/templates' };

const { NODE_ENV, SNOWPACK_PUBLIC_USE_FIREBASE_ANALYTICS } = process.env;

const nodeEnv = NODE_ENV || 'development';

const isProduction = nodeEnv === 'production';

console.error('posthtml.config.js', nodeEnv);

const firebaseInitPath = isProduction
  ? '/__/firebase/init.js'
  : '/lib/firebase-init-app.js';

const firebaseUseSdks = ['auth', 'database', 'storage'];

if (isProduction && SNOWPACK_PUBLIC_USE_FIREBASE_ANALYTICS) {
  firebaseUseSdks.push('analytics');
}

module.exports = {
  input: 'src/templates/*.posthtml',
  plugins: [
    extend(templatePathRootInfo),
    include(templatePathRootInfo),
    expressoins({
      locals: {
        mode: nodeEnv,
        cirrusVersion: '@0.5.5',
        firebaseVersion: onlyVersion(devDeps.firebase),
        firebaseInitPath,
        firebaseUseSdks,
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
