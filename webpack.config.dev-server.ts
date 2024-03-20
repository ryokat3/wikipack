import { Configuration } from "webpack"
import { } from "webpack-dev-server"

const devServerConfig:Configuration = {
    mode: "development",
    devServer: {
        host: '0.0.0.0',
        hot: true,
        open: true,
        port: 18080,
        static: {
            directory: 'dist',
            watch: true
        }
    }
}

const testDevServerConfig: Configuration = {
    mode: "development",
    devServer: {
        host: '0.0.0.0',
        hot: true,
        open: true,
        port: 28080,
        static: {
            directory: 'tmp',
            watch: true
        }
    }
}

module.exports = [ devServerConfig, testDevServerConfig ]