module.exports = {
  exclude: [
    '**/node_modules/**/*',
    '**/__test__/*',
    '**/*.@(spec|test).@(js|mjs)',
    '**/templates/@(layouts|partials)/**/*',
    '**/styles/cdn/**/*',
    '**/typings/**/*',
    '**/*.skip*',
    '**/.pnp.js',
    '**/.gitkeep',
  ],
  plugins: [
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
    // 'src/templates': '/',
    'src/assets': '/assets',
    'src/assets/favicon': '/',
    'src/styles': '/css',
    'src/scripts/index': '/js',
    'src/scripts/404': '/js',
    'src/lib': '/lib',
    'src/components': '/components',
  },
  alias: {
    // 'inferno': 'inferno/dist/index.dev.esm.js',// only development
    '@lib': './src/lib',
    '@components/common': './src/components/common/src',
    '@components/cirrus': './src/components/common/src/cirrus',
    '@components': './src/components',
    '@webModules': './web_modules',
  },
  installOptions: {
    installTypes: true,
    externalPackage: ['https://cdn.skypack.dev', 'styled-jsx/css', 'firebase'],
  },
  install: [],
  devOptions: {
    bundle: false,
  },
};
