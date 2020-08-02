const posthtml = require('posthtml')

module.exports = function(snowpackConfig, pluginOption) {
  return {
    name: '@local/plugin-posthtml',
    transform: ({filePath, fileExt, contents, isDev, isHmrEnabled}) => {
      if(fileExt !== '.phtml') return;

      return posthtml(pluginOption.config.plugins).process(contents)
    }
  }
}
