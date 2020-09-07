const postcssConfig = ctx => ({
  plugins: {
    'postcss-import': {},
    '@fullhuman/postcss-purgecss': ctx.env === 'production' && {
      content: ['./src/templates/**/*.html']
    }
  }
});

module.exports = postcssConfig;
