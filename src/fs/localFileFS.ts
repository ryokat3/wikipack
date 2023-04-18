import { pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'


export function splitPath(pathName:string):string[] {
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
                result[name + "/" + name1] = handle1
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

export async function saveThisDocument() {
    const handle = await getNewFileHandle()
    const writable = await handle.createWritable()

    await writable.write('<!DOCTYPE html>\n' + document.documentElement.outerHTML)
    await writable.close()
    
}