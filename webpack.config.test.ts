import * as path from "path"
import * as glob from "glob"
import { Configuration } from "webpack"
import HtmlWebpackPlugin from "html-webpack-plugin"

const outputDir="tmp"

const browserTestConfig:Configuration = {
    mode: "development",
    devtool: "inline-source-map",
    entry : Object.fromEntries(glob.sync(path.resolve(__dirname, 'test/**/*.ts')).filter((filePath)=>filePath !== "").map((filePath)=> [path.basename(filePath, path.extname(filePath)), filePath])),
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        path: path.resolve(__dirname, outputDir),
        filename: "[name].js"
    },    
    plugins: [
        new HtmlWebpackPlugin({
            title: "Wikipack Browser Test",
            template: "test/template.test.html",
            inject: false
        })
    ]
}

module.exports = [ browserTestConfig ]