import { Configuration } from "webpack"
import { Configuration as DevServerConfiguration } from "webpack-dev-server"


const getDevServerConfig:(port: number, dir: string)=>Configuration & { 'devServer': DevServerConfiguration } = (port:number, dir:string) => {
    return {
        mode: "development",        
        devServer: {
            host: '0.0.0.0',
            port: port,
            hot: true,
            open: true,
            static: {
                directory: dir,
                watch: true
            }
        }
    }
}

module.exports = [ getDevServerConfig(18080, 'dist'), getDevServerConfig(28080, 'tmp') ]