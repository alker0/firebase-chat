module.exports = {
  presets: [
    ['@babel/env', {
      modules: false,
      targets: {
        esmodules: true
      }
    }],
    ['@babel/typescript', {
      isTSX: true,
      allowDeclareFields: true,
      allExtensions: true
    }]
  ],
  plugins: [
    ['inferno', {import: true}],
    'macros',
    '@babel/proposal-class-properties',
    '@babel/proposal-object-rest-spread',
    // ↓ not working
    // ['transform-rename-import', {
    //   replacements: [
    //     {original: 'inferno', replacement: 'https://cdn.skypack.dev/inferno@^7.4.2'}
    //   ]
    // }]
  ]
}
