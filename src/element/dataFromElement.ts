import { DataFile, MarkdownFile } from "../data/FileTree"
import { EMBEDDED_FILE_ID_PREFIX, EMBEDDED_DATA_FILE_CLASS, EMBEDDED_MARKDOWN_FILE_CLASS } from "../constant"
import { dataUrlDecode, dataUrlDecodeAsBlob } from "../utils/appUtils"
import { getMarkdownFile } from "../markdown/converter"
import { updateDataFile, updateMarkdownFile, Folder } from "../data/FileTree"

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

async function getMarkdownFileFromElement(elem:Element):Promise<[string, MarkdownFile] | undefined> {    
    const fileName = getFileNameFromElement(elem)

    if (fileName !== undefined) {    
        const markdown = await dataUrlDecode(elem.innerHTML)
        const timestampStr = elem.getAttribute("timestamp")
        const timestamp = (timestampStr !== null) ? parseInt(timestampStr) : 0    

        return [fileName, getMarkdownFile(markdown, fileName, timestamp)]
    }
    else {
        return undefined
    }
}

async function getDataFileFromElement(elem:Element):Promise<[string, DataFile] | undefined> {
    const fileName = getFileNameFromElement(elem)

    if (fileName !== undefined) {    
        const blob = await dataUrlDecodeAsBlob(elem.innerHTML)
        const dataRef = URL.createObjectURL(blob)
        const timestampStr = elem.getAttribute("timestamp")
        const timestamp = (timestampStr !== null) ? parseInt(timestampStr) : 0    
        const mime = elem.getAttribute("mime") || blob.type

        return [fileName, {
            type: "data",
            dataRef: dataRef,
            buffer: elem.innerHTML,
            timestamp: timestamp,
            mime: mime
        }]
    }
    else {
        return undefined
    }
}

export async function injectAllMarkdownFileFromElement(root:Folder) {
    const markdownElemList = document.getElementsByClassName(EMBEDDED_MARKDOWN_FILE_CLASS)    
    for (const elem of Array.from(markdownElemList)) {        
        if (elem !== null) {
            const fileData = await getMarkdownFileFromElement(elem)
            if (fileData !== undefined) {                                
                updateMarkdownFile(root, fileData[0], fileData[1])
            }
        }
    }    
}

export async function injectAllDataFileFromElement(root:Folder) {
    const dataElemList = document.getElementsByClassName(EMBEDDED_DATA_FILE_CLASS)        
    for (const elem of Array.from(dataElemList)) {        
        if (elem !== null) {
            const fileData = await getDataFileFromElement(elem)
            if (fileData !== undefined) {
                updateDataFile(root, fileData[0], fileData[1])
            }
        }
    }  
}