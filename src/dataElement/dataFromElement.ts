import { DataFileType, CssFileType, MarkdownFileType } from "../fileTree/WikiFile"
import { EMBEDDED_FILE_ID_PREFIX, EMBEDDED_DATA_FILE_CLASS, EMBEDDED_MARKDOWN_FILE_CLASS, EMBEDDED_CSS_FILE_CLASS, FILE_STAMP_ATTR } from "../constant"
import { dataUrlDecode, dataUrlDecodeAsBlob } from "../utils/appUtils"
import { getMarkdownFile } from "../markdown/converter"
import { updateFileOfTree } from "../fileTree/FileTree"
import { FolderType } from "../fileTree/WikiFile"

export function getElementFile(fileName:string):HTMLElement|null {
    return document.getElementById(EMBEDDED_FILE_ID_PREFIX + fileName)
}

export function getElementFileText(fileName:string) {
    const elem = getElementFile(fileName)
    return elem !== null ? elem.innerHTML : undefined
}

function getFileNameFromElement(elem:Element):string|undefined {
    const id = elem.getAttribute("id")
    return (id !== null) && id.startsWith(EMBEDDED_FILE_ID_PREFIX) ? id.slice(EMBEDDED_FILE_ID_PREFIX.length) : undefined
}

async function getMarkdownFileFromElement(elem:Element, isMarkdownFile:(fileName:string)=>boolean):Promise<[string, MarkdownFileType] | undefined> {    
    const fileName = getFileNameFromElement(elem)

    if (fileName !== undefined) {    
        const markdown = await dataUrlDecode(elem.innerHTML)
        const fileStamp = elem.getAttribute(FILE_STAMP_ATTR) || ""        

        return [fileName, getMarkdownFile(markdown, fileName, fileStamp, isMarkdownFile)]
    }
    else {
        return undefined
    }
}

async function getCssFileFromElement(elem:Element):Promise<[string, CssFileType] | undefined> {    
    const fileName = getFileNameFromElement(elem)

    if (fileName !== undefined) {    
        const css = await dataUrlDecode(elem.innerHTML)
        const fileStamp = elem.getAttribute(FILE_STAMP_ATTR) || ""        

        return [fileName, {
            type: "css",
            fileStamp: fileStamp,
            fileSrc: {
                type: 'never'                                
            },
            css: css
        }]
    }
    else {
        return undefined
    }
}

async function getDataFileFromElement(elem:Element):Promise<[string, DataFileType] | undefined> {
    const fileName = getFileNameFromElement(elem)

    if (fileName !== undefined) {    
        const blob = await dataUrlDecodeAsBlob(elem.innerHTML)
        const dataRef = URL.createObjectURL(blob)
        // const dataRef = elem.innerHTML
        const fileStamp = elem.getAttribute(FILE_STAMP_ATTR) || ""        
        const mime = elem.getAttribute("mime") || dataRef.substring(dataRef.indexOf(":")+1, dataRef.indexOf(";"))

        return [fileName, {
            type: "data",
            dataRef: dataRef,
            // buffer: elem.innerHTML,
            buffer: new ArrayBuffer(0), // TODO: Will not be used
            fileStamp: fileStamp,
            fileSrc: {
                type: 'never'
            },
            mime: mime
        }]
    }
    else {
        return undefined
    }
}

export function hasMarkdownFileElement():boolean {
    return document.getElementsByClassName(EMBEDDED_MARKDOWN_FILE_CLASS).length > 0
}

export async function injectAllMarkdownFileFromElement(root:FolderType, isMarkdownFile:(fileName:string)=>boolean) {
    const markdownElemList = document.getElementsByClassName(EMBEDDED_MARKDOWN_FILE_CLASS)    
    for (const elem of Array.from(markdownElemList)) {        
        if (elem !== null) {
            const fileData = await getMarkdownFileFromElement(elem, isMarkdownFile)
            if (fileData !== undefined) {                                
                updateFileOfTree(root, fileData[0], fileData[1])
            }
        }
    }    
}

export async function injectAllCssFileFromElement(root:FolderType) {
    const cssElemList = document.getElementsByClassName(EMBEDDED_CSS_FILE_CLASS)    
    for (const elem of Array.from(cssElemList)) {        
        if (elem !== null) {
            const fileData = await getCssFileFromElement(elem)
            if (fileData !== undefined) {                                
                updateFileOfTree(root, fileData[0], fileData[1])
            }
        }
    }    
}

export async function injectAllDataFileFromElement(rootFolder:FolderType) {
    const dataElemList = document.getElementsByClassName(EMBEDDED_DATA_FILE_CLASS)        
    for (const elem of Array.from(dataElemList)) {        
        if (elem !== null) {
            const fileData = await getDataFileFromElement(elem)
            if (fileData !== undefined) {
                updateFileOfTree(rootFolder, fileData[0], fileData[1])
            }
        }
    }  
}