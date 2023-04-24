import { TopStateType } from "../component/TopReducer"
import { EMBEDDED_MARKDOWN_FILE_CLASS, EMBEDDED_DATA_FILE_CLASS, EMBEDDED_FILE_ID_PREFIX, EMBEDDED_FILE_HEAD_ID, APPLICATION_DATA_MIME_TYPE, CONFIG_ID } from "../constant"
import { MarkdownFile, DataFile, Folder } from '../data/FileTree'
import { dataUrlEncode } from '../utils/appUtils'
import { getElementFile } from "./dataFromElement"
import { addPath } from "../utils/appUtils"

export async function getNewFileHandle() {
    return await window.showSaveFilePicker({
        types: [
            {
                description: "HTML file",
                accept: {
                    "text/html": [ ".html" ]
                }
            }
        ]
    })
}

function createFileElement(fileName:string, timestamp:number):HTMLScriptElement {

    const elem = document.createElement('script')
    elem.setAttribute('id', `${EMBEDDED_FILE_ID_PREFIX}${fileName}`)    
    elem.setAttribute('type', APPLICATION_DATA_MIME_TYPE)
    elem.setAttribute('timestamp', timestamp.toString())    

    return elem
}

async function saveMarkdownFileToElement(fileName:string, markdownFile:MarkdownFile):Promise<HTMLScriptElement|undefined> {
    const dataUrl = await dataUrlEncode(markdownFile.markdown, 'text/plain')    
    if (dataUrl !== null) {
        const elem = createFileElement(fileName, markdownFile.timestamp)        
        elem.setAttribute('class', EMBEDDED_MARKDOWN_FILE_CLASS)
        elem.innerHTML = dataUrl                
        return elem
    }
    else {
        return undefined
    }
}

async function saveDataFileToElement(fileName:string, dataFile:DataFile):Promise<HTMLScriptElement|undefined> {
    if (typeof dataFile.buffer !== 'string') {
        const dataUrl = await dataUrlEncode(dataFile.buffer, dataFile.mime)        
        if (dataUrl !== null) {            
            const elem = createFileElement(fileName, dataFile.timestamp)
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
        const elem = createFileElement(fileName, dataFile.timestamp)
        elem.setAttribute('class', EMBEDDED_DATA_FILE_CLASS)
        elem.setAttribute('mime', dataFile.mime)
        elem.innerHTML = dataFile.buffer
        return elem
    }
}

function saveJsonToElement(fileName:string, data:Object, timestamp:number) {
    const elem = createFileElement(fileName, timestamp)
    elem.innerHTML = JSON.stringify(data)
    return elem
}


async function saveFolderToElement(headElem:HTMLElement, folder:Folder, pathName:string) {
    for (const [fileName, info] of Object.entries(folder.children)) {
        const filePath = addPath(pathName, fileName)
        if (info.type === "markdown") {
            const elem = await saveMarkdownFileToElement(filePath, info)            
            if (elem !== undefined) {                
                headElem.insertAdjacentElement("afterend", elem)
            }
        }
        else if (info.type === "data") {
            const elem = await saveDataFileToElement(filePath, info)            
            if (elem !== undefined) {                
                headElem.insertAdjacentElement("afterend", elem)
            }
        }
        else {
            await saveFolderToElement(headElem, info, filePath)
        }
    }
}

function removeElementList(elemList:HTMLCollectionOf<Element>):void {
    for (const elem of Array.from(elemList)) {
        elem.remove()
    }    
}

export async function cloneThisHTML(state:TopStateType) {

    removeElementList(document.getElementsByClassName(EMBEDDED_MARKDOWN_FILE_CLASS))
    removeElementList(document.getElementsByClassName(EMBEDDED_DATA_FILE_CLASS))
    const configElement = getElementFile(CONFIG_ID)
    if (configElement !== null) {
        configElement.remove()
    }

    const headElem = document.getElementById(EMBEDDED_FILE_HEAD_ID)

    if (headElem !== null) {
      
        await saveFolderToElement(headElem, state.rootFolder, "")

        headElem.insertAdjacentElement("afterend", saveJsonToElement(CONFIG_ID, {
            ...state.config,
            topPage: state.currentPage,
            initialConfig: false
        }, 0))
    }

    const handle = await getNewFileHandle()
    const writable = await handle.createWritable()
    await writable.write('<!DOCTYPE html>\n' + document.documentElement.outerHTML)    
    await writable.close()    
}