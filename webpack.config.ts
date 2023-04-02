import * as fs from "fs"
import * as path from "path"
import { Compiler /*, AssetEmittedInfo */ } from "webpack"
import { inlineSource } from "inline-source"

function newInlineSourcePlugin (assetFileName:string, rootPath:string, template:string, target:string) {
    return (compiler:Compiler) => {
        compiler.hooks.assetEmitted.tap('Inline Source', async (fileName:string/*, info:AssetEmittedInfo*/) => {
            if (assetFileName === fileName) {
                const html = await inlineSource(template, { rootpath: rootPath, compress: false })                
                fs.writeFileSync(target, html)
            }
        })
    }
}

module.exports = {
  entry: './src/index.tsx',
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
