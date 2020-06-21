module.exports = {
  exclude: [
    "**/node_modules/**/*",
    "**/__test__/*",
    "**/spec/*",
    "**/*.@(spec|test).@(js|mjs)",
    "**/*.skip",
    "**/*.gitkeep",
  ],
  plugins: ["./plugins/typescript.js", "@snowpack/plugin-parcel"],
  scripts: {
    "mount:web_modules": "mount web_modules",
    "mount:public": "mount src/public --to /",
    "mount:app": "mount src/app --to /js",
    "mount:assets": "mount src/assets --to /assets",
    "run:ts,tsx": "tsc --noEmit",
    "run:ts,tsx::watch": "$1 --watch",
    "run:styl": "run-p stylus:*",
    "run:styl::watch": "$1 -- --watch",
    "run:sqrl": "squirrelly"
  },
  installOptions: {
    installTypes: true,
  },
  // install: [
  //   "meiosis-setup",
  //   "mergerino",
  //   "pipe-and-compose",
  //   "bluebird",
  //   "inferno",
  // ]
};
