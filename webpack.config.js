const webpack = require('webpack')

const isProd = process.env.NODE_ENV === 'production'

module.exports = function (webpackConfig) {
  if (isProd) {
    webpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin({
      output: {
        ascii_only: true,
      },
      compress: {
        warnings: false,
      },
      // https://github.com/mishoo/UglifyJS2#conditional-compilation-api
      global_defs: {
        // DEBUG: false,
      },
    }))
  } else { // Dev 环境配置
    webpackConfig.entry = {
      index: './example/index',
    }
    webpackConfig.devtool = 'sourcemap'
  }

  return webpackConfig
}
