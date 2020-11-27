const fs = require('fs')
const path = require('path')
const { inlineSource } = require('inline-source')

function newInlineSourcePlugin (assetFileName, rootPath, template, target) {
    return (compiler) => {
        compiler.hooks.assetEmitted.tap('Inline Source', async (fileName, info) => {
            if (assetFileName === fileName) {
                html = await inlineSource(template, { rootpath: rootPath, compress: false })                
                fs.writeFileSync(target, html)
            }
        })
    }
}

module.exports = {
  entry: './src/index.ts',
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
  },
  plugins: [
    newInlineSourcePlugin('inline_markdown.js', 'html', 'html/template.html', './inline_markdown.html')
  ]
}
