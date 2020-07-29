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
    '@snowpack/plugin-babel'
  ],
  scripts: {
    'mount:favicon': 'mount src/assets/favicon --to /',
    'mount:assets': 'mount src/assets --to /assets',
    'mount:web_modules': 'mount web_modules --to /web_modules',
    // 'mount:styles': 'mount src/styles --to /css',
    'mount:public': 'mount src/public --to /',
    'mount:app': 'mount src/app --to /app',
    'mount:lib': 'mount src/lib --to /lib',
    'mount:components': 'mount src/components --to /components',
    'run:ts,tsx': 'tsc --noEmit',
    'run:ts,tsx::watch': '$1 --watch',
    'run:html': 'posthtml -o src/public',
    'run:pcss': 'postcss src/styles/*.pcss --ext .css --dir src/public/css',
    'run:pcss::watch': '$1 --watch',
  },
  proxy: {
    '/__/firebase': 'https://www.gstatic.com/firebasejs'
  },
  installOptions: {
    installTypes: true,
    alias: {
      'inferno': 'inferno/dist/index.dev.esm.js',// only development
    },
  },
  devOptions: {
    bundle: false
  }
}
