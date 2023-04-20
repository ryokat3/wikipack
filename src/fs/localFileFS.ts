import { pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import { TopStateType } from "../renderer/TopReducer"
import { EMBEDDED_FILE_CLASS, EMBEDDED_FILE_ID_PREFIX, EMBEDDED_FILE_HEAD_ID, APPLICATION_DATA_MIME_TYPE, CONFIG_ID } from "../constant"

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

export async function saveThisDocument(state:TopStateType) {
    const handle = await getNewFileHandle()
    const writable = await handle.createWritable()
/*
    const parser = new DOMParser()
    const htmlData = parser.parseFromString(document.documentElement.outerHTML, 'text/html')
    const serializer = new XMLSerializer()
*/
    const elemList = document.getElementsByClassName(EMBEDDED_FILE_CLASS)
    for (let i = 0; i < elemList.length; i++) {
        elemList.item(i)?.remove()
    }

    const headElem = document.getElementById(EMBEDDED_FILE_HEAD_ID)

    if (headElem !== null) {
        for (const [fileName, info] of Object.entries(state.rootFolder.children)) {
            const elem = document.createElement('script')
            elem.setAttribute('id', `${EMBEDDED_FILE_ID_PREFIX}${fileName}`)
            elem.setAttribute('class', EMBEDDED_FILE_CLASS)
            elem.setAttribute('type', APPLICATION_DATA_MIME_TYPE)

            if (info.type === "markdown") {
                elem.innerHTML = info.markdown
            }
            headElem.insertAdjacentElement("afterend", elem)                        
        }

        const config = {
            ...state.config
        }
        config.topPage = state.currentPage
        const elem = document.createElement('script')
        elem.setAttribute('id', `${EMBEDDED_FILE_ID_PREFIX}${CONFIG_ID}`)
        elem.setAttribute('class', EMBEDDED_FILE_CLASS)
        elem.setAttribute('type', APPLICATION_DATA_MIME_TYPE)
        elem.innerHTML = JSON.stringify(config)
        headElem.insertAdjacentElement("afterend", elem)                        
    }

    await writable.write('<!DOCTYPE html>\n' + document.documentElement.outerHTML)
    // await writable.write('<!DOCTYPE html>\n' + serializer.serializeToString(htmlData))
    await writable.close()
    
}