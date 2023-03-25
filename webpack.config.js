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
    filename: 'markdown_all_in_one.js',
    path: path.join(__dirname, 'dist'),
    library: 'markdown_all_in_one',
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
    newInlineSourcePlugin('markdown_all_in_one.js', 'html', 'html/template.html', './markdown-all-in-one.html')
  ]
}
