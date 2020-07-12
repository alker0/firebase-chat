module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-typescript'
  ],
  plugins: [
    'macros',
    '@babel/proposal-class-properties',
    '@babel/proposal-object-rest-spread'
  ]
}
