module.exports = {
  exclude: [
    "**/node_modules/**/*",
    "**/__test__/*",
    "**/spec/*",
    "**/*.@(spec|test).@(js|mjs)",
    "**/*.skip",
    "**/*.gitkeep",
  ],
  // plugins: ["./plugins/typescript", "@snowpack/plugin-parcel"],
  scripts: {
    "mount:web_modules": "mount web_modules",
    "mount:public": "mount src/public --to /",
    //"mount:assets": "mount src/assets --to /assets",
    "mount:assets:favicon": "mount src/assets/favicon --to /",
    "run:styl": "run-p stylus:*",
    "run:styl::watch": "$1 -- --watch",
    "run:sqrl": "yarn run squirrelly"
  },
  // installOptions: {
  //   installTypes: true,
  // },
  // install: [
  //   "meiosis-setup",
  //   "mergerino",
  //   "pipe-and-compose",
  //   "inferno",
  // ]
}
