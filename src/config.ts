import { getElementFileText } from "./dataElement/dataFromElement"
import { CONFIG_ID } from "./constant"
import { CssRulesDataType } from "./css/CssRules"
import defaultConfig from "./defaultConfig.json"

export type ConfigType = Omit<typeof defaultConfig, 'cssRules'> & { 'cssRules': CssRulesDataType }

export function readConfig():ConfigType {
    const embedded = getElementFileText(CONFIG_ID)
    
    return (embedded !== undefined) ? JSON.parse(embedded) : defaultConfig
}
