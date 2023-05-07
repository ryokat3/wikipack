import { CURRENT_CSS_FILE_CLASS, FILE_NAME_ATTR, SEQ_NUMBER_ATTR } from "../constant"
import { getFile } from "../data/FileTree"
import { CssFileType, FolderType } from "../data/FileTreeType"
import { getDir, addPath } from "../utils/appUtils"

export function getCurrentCssElement(): Element[] {    
    return Array.from(document.getElementsByClassName(CURRENT_CSS_FILE_CLASS))
}

export function addCssElement(fileName:string, css:string, seq:number): HTMLStyleElement {
    const elem = document.createElement('style')

    elem.setAttribute(FILE_NAME_ATTR, fileName)
    elem.setAttribute(SEQ_NUMBER_ATTR, seq.toString())
    elem.innerHTML = css

    document.head.appendChild(elem)
    return elem
}

function findCssFiles(folder:FolderType):string[] {
    return Object.entries(folder.children).filter((x):x is [string, CssFileType]=>x[1].type === "css").map(([name, _])=>name)
}

export function collectCssFiles(rootFolder:FolderType, folderName:string):string[] {    
    const dir = getFile(rootFolder, folderName)
    if (dir === undefined) {        
        return []
    }
    else if (dir.type === "folder") {
        const result1 = findCssFiles(dir).map((name)=>addPath(folderName, name))        
        const cssDirPath = addPath(folderName, 'css')
        const cssDir = getFile(rootFolder, cssDirPath)
        if ((cssDir !== undefined) && (cssDir.type === "folder")) {
            const result2 = findCssFiles(cssDir).map((name)=>addPath(cssDirPath, name))            
            if ((result1.length > 0) || (result2.length > 0)) {
                return result1.concat(result2)
            }
        }
        if (result1.length > 0) {
            return result1
        }
    }    
    return (folderName !== "") ? collectCssFiles(rootFolder, getDir(folderName)) : []
}

