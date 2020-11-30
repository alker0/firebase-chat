const extend = require('posthtml-extend');
const expressoins = require('posthtml-expressions');
const include = require('posthtml-include');
const packagesInfo = require('./package.json');

const devDeps = packagesInfo.devDependencies;

const onlyVersion = (semVer) => semVer.replace(/[^\d.]/, '');

const templatePathRootInfo = { root: 'src/templates' };

const {
  NODE_ENV = 'development',
  SNOWPACK_PUBLIC_USE_FIREBASE_ANALYTICS = true,
  SNOWPACK_PUBLIC_CIRRUS_VERSION = '0.6.0',
} = process.env;

const isProduction = NODE_ENV === 'production';

console.error('posthtml.config.js', NODE_ENV);

const firebaseUseSdks = ['auth', 'database', 'storage'];

const cssArray = [
  `https://cdn.jsdelivr.net/npm/cirrus-ui@${SNOWPACK_PUBLIC_CIRRUS_VERSION}/dist/cirrus.min.css`,
  '/css/index.css',
];

const jsArray = [];

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
        mode: NODE_ENV,
        cssArray,
        jsArray,
        firebaseVersion: onlyVersion(devDeps.firebase),
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
