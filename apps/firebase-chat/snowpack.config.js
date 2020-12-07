const {
  FIREBASE_AUTH_EMULATOR_HOST = '',
  SNOWPACK_PUBLIC_AUTH_EMULATOR_PATH = '',
} = require('dotenv').config().parsed ?? {};

module.exports = {
  exclude: [
    '**/node_modules/**/*',
    '**/__test__/*',
    '**/*.@(spec|test).@(js|mjs)',
    '**/templates/@(layouts|partials)/**/*',
    '**/typings/**/*',
    '**/types/**/*',
    '../../packages/type-filtered-clsx/**/*',
    '../../packages/styled-tsx/**/*',
    '**/*.skip*',
    '**/.pnp.js',
    '**/.gitkeep',
  ],
  plugins: [
    '@snowpack/plugin-dotenv',
    [
      '@snowpack/plugin-run-script',
      { cmd: 'tsc --noEmit', watch: '$1 --watch' },
    ],
    '@snowpack/plugin-babel',
    [
      '@snowpack/plugin-build-script',
      { cmd: 'postcss', input: ['.pcss'], output: ['.css'] },
    ],
    [
      '../../plugins/snowpack-posthtml.js',
      { inputDir: './src/templates', config: require('./posthtml.config') },
    ],
  ],
  mount: {
    web_modules: '/web_modules',
    'src/public': '/',
    'src/templates': '/',
    'src/assets': '/assets',
    'src/assets/favicon': '/',
    'src/styles': '/css',
    'src/scripts/index': '/js',
    'src/scripts/404': '/js',
    'src/lib': '/lib',
    'src/components': '/components',
    '../../packages/solid-components/src': '/components',
  },
  alias: {
    '@lib': './src/lib',
    '@components/project': './src/components',
    '@components/common': '../../packages/solid-components/src',
    '@components/types': '../../packages/solid-components/types',
    '@web_modules': './web_modules',
    '@alker/cirrus-types': '../../packages/cirrus-types',
    '@alker/styled-tsx': '../../packages/styled-tsx',
    '@alker/type-filtered-clsx': '../../packages/type-filtered-clsx',
  },
  installOptions: {
    installTypes: true,
    externalPackage: [
      'https://cdn.skypack.dev',
      'styled-jsx/css',
      'firebase',
      'firebaseui',
    ],
  },
  install: ['solid-styled-jsx'],
  proxy: {
    [SNOWPACK_PUBLIC_AUTH_EMULATOR_PATH]: `http://${FIREBASE_AUTH_EMULATOR_HOST}`,
  },
  devOptions: {
    bundle: false,
    port: 8080,
  },
};
