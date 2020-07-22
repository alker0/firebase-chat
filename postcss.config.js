const env = process.env['NODE_ENV']

const postcssConfig = {
  plugins: {
    'postcss-import': {},
    ...(env === 'production' ? {
      '@fullhuman/postcss-purgecss': {
        content: ['./src/templates/**/*.html']
      }
    } : {})
  }
}

module.exports = postcssConfig
