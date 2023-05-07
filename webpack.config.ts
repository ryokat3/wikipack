import * as fs from "fs"
import * as path from "path"
import { Compiler, Configuration } from "webpack"
import { inlineSource } from "inline-source"

function newInlineSourcePlugin (assetFileName:string, rootPath:string, template:string, target:string) {
    return (compiler:Compiler) => {
        compiler.hooks.assetEmitted.tap('Inline Source', async (fileName:string) => {
            if (assetFileName === fileName) {
                const html = await inlineSource(template, { rootpath: rootPath, compress: false })                                
                fs.writeFileSync(target, html)
            }
        })
    }
}

const commonConfig:Configuration = {  
  devtool: "source-map",
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.json' ]
  },
  mode: 'development',
  module: {
    rules: [
      { test: /\.tsx?$/, loader: "ts-loader" },      
      { enforce: "pre", test: /\.js\.map$/, loader: "source-map-loader" },
      {
        test: /\.(asdata|md|html)$/i,
        type: 'asset/source'
      }
    ]
  }
}

const fileWorkerConfig:Configuration = {  
  ...commonConfig,
  name: 'fileWorker',
  entry: './src/localFile/fileWorker.ts',      
  output: {
    filename: 'fileWorker.bundle.js.asdata',
    path: path.join(__dirname, 'src/tmp'),
    publicPath: ''
  }
}

const mainConfig:Configuration = {  
  ...commonConfig,
  entry: './src/index.tsx',      
  output: {
    filename: 'wikipack.js',
    path: path.join(__dirname, 'dist'),
    library: 'wikipack',
    libraryTarget: 'umd',
    publicPath: ''
  },
  dependencies: [ 'fileWorker' ],
  plugins: [
    newInlineSourcePlugin('wikipack.js', 'src', 'src/template.html', './wikipack.html')
  ]
}

module.exports = [ fileWorkerConfig, mainConfig ]