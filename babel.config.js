module.exports = {
  presets: [
    [
      '@babel/env',
      {
        modules: false,
        targets: {
          esmodules: true,
        },
      },
    ],
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
    ['styled-jsx/babel', { styleModule: '/web_modules/solid-styled-jsx.js' }],
    'macros',
    '@babel/proposal-class-properties',
    '@babel/proposal-object-rest-spread',
    ...(process.env.NODE_ENV === 'production' ? ['transform-remove-console'] : [])
  ],
};
