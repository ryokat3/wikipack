
import { EMBEDDED_MARKDOWN_FILE_CLASS, EMBEDDED_DATA_FILE_CLASS, EMBEDDED_CSS_FILE_CLASS, EMBEDDED_FILE_ID_PREFIX, APPLICATION_DATA_MIME_TYPE, FILE_STAMP_ATTR } from "../constant"
import { MarkdownFileType, CssFileType, DataFileType, FolderType } from '../fileTree/WikiFile'
import { dataUrlEncode } from '../utils/appUtils'
import { addPath } from "../utils/appUtils"


function createFileElement(pagePath:string, fileStamp:string):HTMLScriptElement {
    const elem = document.createElement('script')
    elem.setAttribute('id', `${EMBEDDED_FILE_ID_PREFIX}${pagePath}`)    
    elem.setAttribute('type', APPLICATION_DATA_MIME_TYPE)
    elem.setAttribute(FILE_STAMP_ATTR, fileStamp)    

    return elem
}

async function saveMarkdownFileToElement(pagePath:string, markdownFile:MarkdownFileType):Promise<HTMLScriptElement|undefined> {
    const dataUrl = await dataUrlEncode(markdownFile.markdown, 'text/plain')    
    if (dataUrl !== null) {
        const elem = createFileElement(pagePath, markdownFile.fileStamp)        
        elem.setAttribute('class', EMBEDDED_MARKDOWN_FILE_CLASS)
        elem.innerHTML = dataUrl                
        return elem
    }
    else {
        return undefined
    }
}

async function saveCssFileToElement(pagePath:string, cssFile:CssFileType):Promise<HTMLScriptElement|undefined> {
    const dataUrl = await dataUrlEncode(cssFile.css, 'text/css')    
    if (dataUrl !== null) {
        const elem = createFileElement(pagePath, cssFile.fileStamp)        
        elem.setAttribute('class', EMBEDDED_CSS_FILE_CLASS)
        elem.innerHTML = dataUrl                
        return elem
    }
    else {
        return undefined
    }
}

/*
async function saveDataFileToElement(fileName:string, dataFile:DataFileType):Promise<HTMLScriptElement|undefined> {
    if (typeof dataFile.buffer !== 'string') {
        const dataUrl = await dataUrlEncode(dataFile.buffer, dataFile.mime)        
        if (dataUrl !== null) {            
            const elem = createFileElement(fileName, dataFile.fileStamp)
            elem.setAttribute('class', EMBEDDED_DATA_FILE_CLASS)
            elem.setAttribute('mime', dataFile.mime)
            elem.innerHTML = dataUrl                        
            return elem
        }
        else {
            return undefined
        }
    }    
    else {
        const elem = createFileElement(fileName, dataFile.fileStamp)
        elem.setAttribute('class', EMBEDDED_DATA_FILE_CLASS)
        elem.setAttribute('mime', dataFile.mime)
        elem.innerHTML = dataFile.buffer
        return elem
    }
}
*/

async function saveDataFileToElement(pagePath:string, dataFile:DataFileType):Promise<HTMLScriptElement|undefined> {
    const dataUrl = await dataUrlEncode(dataFile.buffer, dataFile.mime)        
    if (dataUrl !== null) {            
        const elem = createFileElement(pagePath, dataFile.fileStamp)
        elem.setAttribute('class', EMBEDDED_DATA_FILE_CLASS)
        elem.setAttribute('mime', dataFile.mime)
        elem.innerHTML = dataUrl                        
        return elem
    }
    else {
        return undefined
    }
}

export function saveJsonToElement(pagePath:string, data:Object, fileStamp:string) {
    const elem = createFileElement(pagePath, fileStamp)
    elem.innerHTML = JSON.stringify(data)
    return elem
}


export async function saveFolderToElement(doc:Document, folder:FolderType, pageFolderPath:string) {
    for (const [pageName, info] of Object.entries(folder.children)) {
        const pagePath = addPath(pageFolderPath, pageName)
        if (info.type === "markdown") {
            const elem = await saveMarkdownFileToElement(pagePath, info)            
            if (elem !== undefined) {   
                doc.head.appendChild(elem)
            }
        }
        else if (info.type === "data") {
            const elem = await saveDataFileToElement(pagePath, info)     
            if (elem !== undefined) {
                doc.head.appendChild(elem)
            }
        }
        else if (info.type === "css") {
            const elem = await saveCssFileToElement(pagePath, info)
            if (elem !== undefined) {                
                doc.head.appendChild(elem)                
            }           
        }
        else {
            await saveFolderToElement(doc, info, pagePath)            
        }
    }
}
