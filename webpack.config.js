const path = require('path')

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: 'main.js'
  },
  // 在 webpack 解析 loader 的时候配置如何查找
  resolveLoader: {
    alias: {
      'inline1-loader': path.resolve(__dirname, 'loaders', 'inline1-loader.js'),
      'inline2-loader': path.resolve(__dirname, 'loaders', 'inline2-loader.js'),
    },
    modules: ['node_modules', path.resolve(__dirname, 'loaders')]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          // 在配置里直接这样配置的话，类型就是 normal
          path.resolve(__dirname, 'loaders', "normal1-loader.js"),
          path.resolve(__dirname, 'loaders', "normal2-loader.js")
        ]
      },
      {
        test: /\.js$/,
        enforce: 'post',
        use: [
          // 如果在配置的时候添加了 enforce=post 参数，那么这个 loader 就是 post-loader
          path.resolve(__dirname, 'loaders', "post1-loader.js"),
          path.resolve(__dirname, 'loaders', "post2-loader.js")
        ]
      },
      {
        test: /\.js$/,
        enforce: 'pre',
        use: [
          // 如果在配置的时候添加了 enforce=post 参数，那么这个 loader 就是 post-loader
          path.resolve(__dirname, 'loaders', "pre1-loader.js"),
          path.resolve(__dirname, 'loaders', "pre2-loader.js")
        ]
      }
    ]
  }
}