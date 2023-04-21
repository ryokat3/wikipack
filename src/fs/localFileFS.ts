import { pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import { TopStateType } from "../renderer/TopReducer"
import { EMBEDDED_MARKDOWN_FILE_CLASS, EMBEDDED_DATA_FILE_CLASS, EMBEDDED_FILE_ID_PREFIX, EMBEDDED_FILE_HEAD_ID, APPLICATION_DATA_MIME_TYPE, CONFIG_ID } from "../constant"
import { MarkdownFile, DataFile, Folder } from '../markdown/FileTree'
import { dataUrlEncode } from '../utils/browserUtils'
import { getFileElement } from "./embeddedFileFS"

function removeParentDir(pathName:string[]):string[] {
    const result:string[] = []
    for (let i = 0; i < pathName.length; i++) {
        if (i == pathName.length - 1) {
            result.push(pathName[i])
        }
        else if (pathName[i] !== ".." && pathName[i+1] === "..") {
            ++i
        }
        else {
            result.push(pathName[i])
        }
    }    
    return result
}

export function splitPath(pathName:string):string[] {
    return pipe(
        pathName.split('/'),
        (pathList:string[]) => pathList.length > 0 ? O.some(pathList) : O.none,
//        O.map((pathList:string[])=> pathList.at(0) === '' ? pathList.slice(1) :  pathList),
//        O.chain((pathList:string[]) => pathList.length > 0 ? O.some(pathList) : O.none),
//        O.map((pathList:string[])=> pathList.at(-1) === '' ? pathList.slice(0,-1) :  pathList),
//        O.chain((pathList:string[]) => pathList.length > 0 ? O.some(pathList) : O.none),       
        O.map((pathList:string[])=> pathList.filter((name:string)=>name !== "." && name !== '')), 
        O.map((pathList:string[])=> removeParentDir(pathList)), 
        O.getOrElse(()=>[] as string[])
    )
}

export function addPath(dirName:string, fileName:string):string {
    return splitPath(`${dirName}/${fileName}`).join("/")
}

export function normalizePath(fileName:string):string {
    return splitPath(fileName).join("/")
}

export function getDir(fileName:string):string {
    return splitPath(fileName).slice(0,-1).join('/')
}

export async function getHandle(dirHandle:FileSystemDirectoryHandle, pathName:string[]|string):Promise<FileSystemHandle|undefined> {
    if (typeof pathName === 'string') {
        return getHandle(dirHandle, splitPath(pathName))        
    }
    else {
        
        for await (const [name, handle] of dirHandle.entries()) {
            if (name === pathName[0]) {
                if (pathName.length == 1) {
                    return handle
                }
                else if (handle.kind == "directory") {
                    if (pathName.length > 1) {
                        return getHandle(handle, pathName.slice(1))
                    }
                }
                return undefined
            }
        }
        return undefined
    }

}
export async function collectFiles(dirHandle:FileSystemDirectoryHandle, pred:(fileName:string)=>boolean) {
    
    const result = Object.create(null) as { [name:string]: FileSystemFileHandle }
    for await (const [name, handle] of dirHandle.entries()) {
        if (pred(name) && (handle.kind === 'file')) {
            result[name] = handle
        }
        else if (handle.kind === 'directory') {
            Object.entries((await collectFiles(handle, pred))).forEach(([name1, handle1])=>{
                result[splitPath(name + "/" + name1).join("/")] = handle1
            })
        }
    }
    return result
}

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

function createSaveFileElement(fileName:string, timestamp:number):HTMLScriptElement {

    const elem = document.createElement('script')
    elem.setAttribute('id', `${EMBEDDED_FILE_ID_PREFIX}${fileName}`)
    
    elem.setAttribute('type', APPLICATION_DATA_MIME_TYPE)
    elem.setAttribute('timestamp', timestamp.toString())    

    return elem
}

async function createMarkdownFileElement(fileName:string, markdownFile:MarkdownFile):Promise<HTMLScriptElement|undefined> {
    const dataUrl = await dataUrlEncode(markdownFile.markdown, 'text/plain')    
    if (dataUrl !== null) {
        const elem = createSaveFileElement(fileName, markdownFile.timestamp)        
        elem.setAttribute('class', EMBEDDED_MARKDOWN_FILE_CLASS)
        elem.innerHTML = dataUrl                
        return elem
    }
    else {
        return undefined
    }
}

async function createDataFileElement(fileName:string, dataFile:DataFile):Promise<HTMLScriptElement|undefined> {
    if (typeof dataFile.buffer !== 'string') {
        const dataUrl = await dataUrlEncode(dataFile.buffer, dataFile.mime)        
        if (dataUrl !== null) {            
            const elem = createSaveFileElement(fileName, dataFile.timestamp)
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
        const elem = createSaveFileElement(fileName, dataFile.timestamp)
        elem.setAttribute('class', EMBEDDED_DATA_FILE_CLASS)
        elem.setAttribute('mime', dataFile.mime)
        elem.innerHTML = dataFile.buffer
        return elem
    }
}

function createJsonElement(fileName:string, data:Object, timestamp:number) {
    const elem = createSaveFileElement(fileName, timestamp)
    elem.innerHTML = JSON.stringify(data)
    return elem
}


async function saveFolder(headElem:HTMLElement, folder:Folder, pathName:string) {
    for (const [fileName, info] of Object.entries(folder.children)) {
        const filePath = addPath(pathName, fileName)
        if (info.type === "markdown") {
            const elem = await createMarkdownFileElement(filePath, info)            
            if (elem !== undefined) {                
                headElem.insertAdjacentElement("afterend", elem)
            }
        }
        else if (info.type === "data") {
            const elem = await createDataFileElement(filePath, info)            
            if (elem !== undefined) {                
                headElem.insertAdjacentElement("afterend", elem)
            }
        }
        else {
            await saveFolder(headElem, info, filePath)
        }
    }
}

function removeElem(elemList:HTMLCollectionOf<Element>):void {
    for (let i = 0; i < elemList.length; i++) {
        elemList.item(i)?.remove()
    }    
}


export async function saveThisDocument(state:TopStateType) {
    const handle = await getNewFileHandle()
    const writable = await handle.createWritable()


    removeElem(document.getElementsByClassName(EMBEDDED_MARKDOWN_FILE_CLASS))
    removeElem(document.getElementsByClassName(EMBEDDED_DATA_FILE_CLASS))
    const configElement = getFileElement(CONFIG_ID)
    if (configElement !== null) {
        configElement.remove()
    }

    const headElem = document.getElementById(EMBEDDED_FILE_HEAD_ID)

    if (headElem !== null) {
      
        await saveFolder(headElem, state.rootFolder, "")

        headElem.insertAdjacentElement("afterend", createJsonElement(CONFIG_ID, {
            ...state.config,
            topPage: state.currentPage,
            initialConfig: false
        }, 0))
    }

    await writable.write('<!DOCTYPE html>\n' + document.documentElement.outerHTML)    
    await writable.close()    
}