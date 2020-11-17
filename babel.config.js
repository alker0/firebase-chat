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
    [
      '@babel/typescript',
      {
        isTSX: true,
        allowDeclareFields: true,
        allExtensions: true,
      },
    ],
  ],
  plugins: ['@babel/proposal-object-rest-spread'],
};
