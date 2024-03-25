import * as fs from "fs"
import * as path from "path"
import { Compiler, Configuration, RuleSetRule } from "webpack"
import { inlineSource } from "inline-source"

const OUTPUT_DIR = 'dist'

function newInlineSourcePlugin (assetFileName:string, rootPath:string, template:string, target:string, compress:boolean) {
    return (compiler:Compiler) => {
        compiler.hooks.assetEmitted.tap('Inline Source', async (fileName:string) => {
            if (assetFileName === fileName) {
                const html = await inlineSource(template, { rootpath: rootPath, compress: compress })
                fs.writeFileSync(target, html)
            }
        })
    }
}

const commonRules:RuleSetRule[] = [
  {
    test: /\.tsx?$/,
    loader: "ts-loader"
  },  
  {
    test: /\.(asdata|md|html|css)$/i,
    type: 'asset/source'
  }  
]

const commonConfig: (mode: "development" | "production") => Configuration = (mode: "development" | "production") => {
  const rules:RuleSetRule[] = (mode === "development") ? [...commonRules, { enforce: "pre", test: /\.js\.map$/, loader: "source-map-loader" } ] : commonRules

  return {
    devtool: "source-map",
    resolve: {
      extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.json']
    },
    mode: mode,
    module: {
      rules: rules
    }
  }
}

const workerConfig: (mode: "development" | "production") => Configuration = (mode: "development" | "production") => {
  return {
    ...commonConfig(mode),
    name: 'worker',
    entry: './src/worker/worker.ts',
    output: {
      filename: 'worker.bundle.js.asdata',
      path: path.join(__dirname, 'src/tmp'),
      publicPath: ''
    }
  }
}

const mainConfig: (mode: "development" | "production") => Configuration = (mode: "development" | "production") => {
  return {
    ...commonConfig(mode),
    name: 'main',
    entry: './src/index.tsx',
    output: {
      filename: 'wikipack.js',
      path: path.join(__dirname, OUTPUT_DIR),
      library: 'wikipack',
      libraryTarget: 'umd',
      publicPath: ''
    },
    dependencies: ['worker'],
    plugins: [
      newInlineSourcePlugin('wikipack.js', 'src', 'src/template.html', './dist/index.html', mode === "production")
    ]
  }
}

module.exports = (_env:any, _mode:"development" | "production" | "none" | undefined) => {
  const mode:"development" | "production" = (_mode === "production") ? "production" : "development"  
  return [ workerConfig(mode), mainConfig(mode) ]
}