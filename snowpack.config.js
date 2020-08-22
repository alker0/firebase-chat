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
    ['./plugins/snowpack-firebase-proxy.js'],
    [
      './plugins/snowpack-posthtml.js',
      { inputDir: './src/templates', config: require('./posthtml.config') },
    ],
  ],
  mount: {
    'web_modules': '/web_modules',
    'src/public': '/',
    // 'src/templates': '/',
    'src/assets': '/assets',
    'src/assets/favicon': '/',
    'src/styles': '/css',
    'src/app/index': '/js',
    'src/app/404': '/js',
    'src/lib': '/lib',
    'src/components': '/components',
  },
  alias: {
    // 'inferno': 'inferno/dist/index.dev.esm.js',// only development
    '@lib': './src/lib',
    '@components/raw': './src/components/raw',
    '@components/cirrus': './src/components/cirrus/src',
    '@webModules': './web_modules',
  },
  proxy: {
    '/__/firebase': 'https://www.gstatic.com/firebasejs',
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
