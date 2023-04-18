import { getEmbeddedFile } from "./fs/embeddedFileFS"
import { CONFIG_ID } from "./constant"
import defaultConfig from "./defaultConfig.json"

export type ConfigType = typeof defaultConfig

export function readConfig():ConfigType {
    const embedded = getEmbeddedFile(CONFIG_ID)
    
    return (embedded !== undefined) ? JSON.parse(embedded) : defaultConfig
}
