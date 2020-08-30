module.exports = {
  presets: [
    'solid',
    [
      '@babel/typescript',
      {
        isTSX: true,
        allowDeclareFields: true,
        allExtensions: true,
      },
    ],
  ],
  plugins: [
    // ['styled-jsx/babel', { styleModule: '/web_modules/solid-styled-jsx.js' }],
    'solid-styled-jsx',
    '@babel/proposal-object-rest-spread',
  ],
};
