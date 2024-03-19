
import { splitPath } from "../utils/appUtils"

export async function getHandleMap(dirHandle:FileSystemDirectoryHandle):Promise<{ [name:string]:FileSystemHandle }> {
    let result = Object.create(null)
    for await (const [name, handle] of dirHandle.entries()) {
        result = {
            ...result,
            [name]:handle
        }
    }
    return result
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
        if (pred(name) && isFileHandle(handle)) {
            result[name] = handle
        }
        else if (isDirectoryHandle(handle)) {
            Object.entries((await collectFiles(handle, pred))).forEach(([name1, handle1])=>{
                result[splitPath(name + "/" + name1).join("/")] = handle1
            })
        }
    }
    return result
}

export function isFileHandle(handle:FileSystemHandle):handle is FileSystemFileHandle {
    return handle.kind === "file"
}

export function isDirectoryHandle(handle:FileSystemHandle):handle is FileSystemDirectoryHandle {
    return handle.kind === "directory"
}