const { isConstructorDeclaration } = require("typescript")

module.exports = ctx => {
  console.log('env: ', ctx)
  console.log(`input: ${ctx.file.basename}`)
  return {
    plugins: {
      'postcss-import': {},
      'postcss-ts-classnames': ctx.env === 'typing' && {dest: `src/lib/${ctx.file.basename}.d.ts`}
    }
  }
}
