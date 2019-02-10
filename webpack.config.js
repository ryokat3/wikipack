const path = require('path');

module.exports = {
  entry: './src/main.ts',
  output: {
    filename: 'inline_markdown.js',
    path: path.join(__dirname, 'dist'),
    library: 'inline_markdown',
    libraryTarget: 'umd'
  },
  devtool: "source-map",
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.json' ]
  },
  mode: 'development',
  module: {
    rules: [
      { test: /\.tsx?$/, loader: "ts-loader" },
      { enforce: "pre", test: /\.js\.map$/, loader: "source-map-loader" }
    ]
  }
}
