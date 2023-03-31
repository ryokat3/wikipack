import { pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'


function splitPath(pathName:string):string[] {
    return pipe(
        pathName.split('/'),
        (pathList:string[]) => pathList.length > 0 ? O.some(pathList) : O.none,
        O.map((pathList:string[])=> pathList.at(0) === '' ? pathList.slice(1) :  pathList),
        O.chain((pathList:string[]) => pathList.length > 0 ? O.some(pathList) : O.none),
        O.map((pathList:string[])=> pathList.at(-1) === '' ? pathList.slice(0,-1) :  pathList),
        O.chain((pathList:string[]) => pathList.length > 0 ? O.some(pathList) : O.none),
        O.getOrElse(()=>[] as string[])
    )
}

async function getHandleInDirectory(dirHandle:FileSystemDirectoryHandle, pred:(key:string)=>boolean):Promise<FileSystemHandle|undefined> {
    for await (const [key, handle] of dirHandle.entries()) {
        if (pred(key)) {
            return handle
        }
    }
    return undefined
}

export async function findFSHandle(dirHandle:FileSystemDirectoryHandle, pred:(key:string)=>boolean):Promise<[string, FileSystemHandle][]> {    
    let result:[string, FileSystemHandle][] = []
    for await (const [key, handle] of dirHandle.entries()) {
        if (pred(key)) {
            result.push([key, handle])
        }
    }    
    return result
}

async function getFileSystemHandleRecur(dirHandle:FileSystemDirectoryHandle, pathList:string[]):Promise<FileSystemHandle|undefined> {
    if (pathList.length == 0) {
        return dirHandle
    }
    const handle = await getHandleInDirectory(dirHandle, (key:string)=>pathList[0] === key)
    if (pathList.length == 1) {
        return handle
    }
    else if ((handle === undefined) || (handle.kind !== 'directory')) {
        return undefined
    }
    else {
        return getFileSystemHandleRecur(handle as FileSystemDirectoryHandle, pathList.slice(1))
    }
}

export async function getFSHandle(dirHandle:FileSystemDirectoryHandle, pathName:string):Promise<FileSystemHandle|undefined> {
    return await getFileSystemHandleRecur(dirHandle, splitPath(pathName))
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

export async function saveThisDocument() {
    const handle = await getNewFileHandle()
    const writable = await handle.createWritable()

    await writable.write('<!DOCTYPE html>\n' + document.documentElement.outerHTML)
    await writable.close()
    
}

