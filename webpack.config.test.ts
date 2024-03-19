import * as path from "path"
import * as glob from "glob"
import { Configuration } from "webpack"
import { Configuration as DevServerConfiguration } from "webpack-dev-server"
import HtmlWebpackPlugin from "html-webpack-plugin"

const outputDir="tmp"

const browserTestConfig:Configuration = {
    mode: "development",
    devtool: "inline-source-map",
    entry : Object.fromEntries(glob.sync(path.resolve(__dirname, 'test/**/*.ts')).map((filePath)=> [path.basename(filePath, path.extname(filePath)), filePath])),
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

const devServerConfig:DevServerConfiguration = {
    host: '0.0.0.0',
    hot: true,
    open: true,
    port: 18080,    
    static: {
        directory: outputDir,
        watch: true
    }
}

module.exports = [ {...browserTestConfig, devServer: devServerConfig } ]