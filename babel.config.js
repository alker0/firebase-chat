module.exports = {
  presets: [
    ['@babel/env'],
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
    '@babel/proposal-object-rest-spread'
  ]
}
