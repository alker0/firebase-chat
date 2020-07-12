module.exports = {
  exclude: [
    '**/node_modules/**/*',
    '**/__test__/*',
    '**/spec/*',
    '**/*.@(spec|test).@(js|mjs)',
    '**/*.d.ts',
    '**/*.skip',
    '**/*.gitkeep',
  ],
  plugins: ['./plugins/typescript.js', '@snowpack/plugin-parcel'],
  scripts: {
    'mount:web_modules': 'mount web_modules',
    'mount:public': 'mount src/public --to /',
    'mount:app': 'mount src/app --to /js',
    'mount:assets': 'mount src/assets --to /assets',
    'run:ts,tsx': 'tsc --noEmit',
    'run:ts,tsx::watch': '$1 --watch',
    'run:css': 'run-p postcss:*',
    'run:css::watch': '$1 -- --watch',
    'run:sqrl': 'yarn run squirrelly'
  },
  proxy: {
    '/__/firebase': 'https://www.gstatic.com/firebasejs'
  },
  installOptions: {
    installTypes: true,
  },
  install: [
    // "mergerino",
  ]
}
