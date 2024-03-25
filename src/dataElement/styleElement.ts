import { MARKDOWN_CSS_FILE_CLASS, FILE_NAME_ATTR, SEQ_NUMBER_ATTR, DEFAULT_CSS_CLASS } from "../constant"
import { getFileFromTree } from "../fileTree/FileTree"
import { CssFileType, FolderType } from "../fileTree/FileTreeType"
import { getDir, addPath } from "../utils/appUtils"

import defaultHighlightCss from "../../node_modules/highlight.js/styles/github.min.css"
import defaultMarkdownCss from "../../node_modules/github-markdown-css/github-markdown.css"


export function getMarkdownCssElement(): Element[] {    
    return Array.from(document.getElementsByClassName(MARKDOWN_CSS_FILE_CLASS))
}

export function addDefaultCssElement():void {
    addCssElement(defaultMarkdownCss, DEFAULT_CSS_CLASS, {})
    addCssElement(defaultHighlightCss, DEFAULT_CSS_CLASS, {})    
}

export function removeDefaultCssElement():void {
    Array.from(document.getElementsByClassName(DEFAULT_CSS_CLASS)).forEach((elem:Element)=>{
        elem.remove()
    })
}

export function addCssElement(css:string, className:string, attrs:{ [attr:string]:string }): HTMLStyleElement {
    const elem = document.createElement('style')

    elem.classList.add(className)
    Object.entries(attrs).forEach(([name, value])=>{
        elem.setAttribute(name, value)
    })
    elem.innerHTML = css

    document.head.appendChild(elem)
    return elem
}

export function addMarkdownCssElement(fileName:string, css:string, seq:number): HTMLStyleElement {
    return addCssElement(css, MARKDOWN_CSS_FILE_CLASS, {
        FILE_NAME_ATTR: fileName,
        SEQ_NUMBER_ATTR: seq.toString()
    })
}

function findCssFiles(folder:FolderType):string[] {
    return Object.entries(folder.children).filter((x):x is [string, CssFileType]=>x[1].type === "css").map(([name, _])=>name)
}

export function collectCssFiles(rootFolder:FolderType, folderName:string):string[] {    
    const dir = getFileFromTree(rootFolder, folderName)
    if (dir === undefined) {        
        return []
    }
    else if (dir.type === "folder") {
        const result1 = findCssFiles(dir).map((name)=>addPath(folderName, name))        
        const cssDirPath = addPath(folderName, 'css')
        const cssDir = getFileFromTree(rootFolder, cssDirPath)
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

/**
 * CSS list with revision number
 */
export type CssInfo = { [cssFileName:string]: number }

/**
 * Returns new CSS info based on CSS fileName list
 * 
 * @param cssInfo 
 * @param asCssFilter 
 * @returns CssInfo
 */
export function updateCssInfo(cssInfo: CssInfo, asCssFilter:string[]): CssInfo {
    return asCssFilter.reduce<CssInfo>((acc, name) => (name in Object.keys(acc)) ? acc : {
        ...acc,
        [name]: 0        
    }, Object.fromEntries(Object.entries(cssInfo).filter(([name, _]) => name in asCssFilter)))
}

/**
 * Filter and get CSS info from the document
 * 
 * @param asCssFilter 
 */
function getMarkdownCssInfo(asCssFilter:CssInfo):CssInfo {
    
    return getMarkdownCssElement().reduce<CssInfo>((cssInfo, elem) => {
        const cssFileName = elem.getAttribute(FILE_NAME_ATTR)
        const seq = Number.parseInt(elem.getAttribute(SEQ_NUMBER_ATTR) || "-1")

        if ((cssFileName === null) || !(cssFileName in Object.keys(asCssFilter))) {
            elem.remove()
            return cssInfo
        }
        else if ((seq < 0) || asCssFilter[cssFileName] > seq) {
            elem.remove()
            return cssInfo
        }
        else {
            return {
                ...cssInfo,
                cssFileName: seq
            }
        }
    }, Object.create(null))
}

function addMarkdownCssInfo(rootFolder:FolderType, cssInfo:CssInfo):void {
    Object.entries(cssInfo).forEach(([cssFileName, _]) => {       
        const result = getFileFromTree(rootFolder, cssFileName)
        if ((result !== undefined) && (result.type === "css")) {
            addMarkdownCssElement(cssFileName, result.css, cssInfo[cssFileName])
        }       
    })     
}

export function applyCssInfo(rootFolder:FolderType, cssInfo:CssInfo):void {
    const currentCssInfo = getMarkdownCssInfo(cssInfo)
    const toBeAdded = Object.entries(cssInfo).reduce<CssInfo>((acc, [fileName, rev])=>{
        return (!(fileName in Object.keys(currentCssInfo))) ? { ...acc, [fileName]: rev } : acc
    }, Object.create(null))
    addMarkdownCssInfo(rootFolder, toBeAdded)
}
