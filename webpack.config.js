const path = require('path')

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  devtool: false,
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: 'main.js'
  },
  // 在 webpack 解析 loader 的时候配置如何查找
  resolveLoader: {
    alias: {
      'inline1-loader': path.resolve(__dirname, 'loaders', 'inline1-loader.js'),
      'inline2-loader': path.resolve(__dirname, 'loaders', 'inline2-loader.js'),
      'babel-loader': path.resolve(__dirname, 'loaders', 'babel-loader.js')
    },
    modules: ['node_modules', path.resolve(__dirname, 'loaders')]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"]
          }
        }
      },
    ]
  }
}