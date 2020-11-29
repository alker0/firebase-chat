const { nodeResolve } = require('@rollup/plugin-node-resolve');
const typescript = require('@rollup/plugin-typescript');
const commonjs = require('@rollup/plugin-commonjs');

const camelCase = require('camelcase');

const pkg = require('./package.json');

const moduleName = camelCase(pkg.name.replace(/^@.*\//, ''), {
  pascalCase: true,
});

const banner = `/*!
  ${moduleName}.js v${pkg.version}
  ${pkg.homepage}
  Released under the ${pkg.license} License.
*/`;

module.exports = [
  // ESM
  {
    input: 'src/index.ts',
    output: {
      file: pkg.module,
      format: 'es',
      sourcemap: 'inline',
      banner,
    },
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
    ],
    plugins: [
      nodeResolve(),
      typescript(),
      commonjs({ extensions: ['.ts', '.js'] }),
    ],
  },
  // CommonJS & types
  {
    input: 'src/index.ts',
    output: [
      {
        dir: 'dist',
        format: 'cjs',
        exports: 'auto',
        sourcemap: 'inline',
        banner,
      },
    ],
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
    ],
    plugins: [
      nodeResolve(),
      typescript({
        rootDir: './src',
        declaration: true,
        declarationDir: './dist',
      }),
      commonjs({ extensions: ['.ts', '.js'] }),
    ],
  },
];
