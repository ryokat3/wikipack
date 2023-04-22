import { pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'

/************************************************************************************************ 
Data URI converter
************************************************************************************************/

export async function dataUrlEncode(data:string|ArrayBuffer, mime:string):Promise<string|null> {
    return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result)
            }
            else if (reader.result !== null) {
                resolve(arrayBufferToString(reader.result))
            }
            else {
                resolve(null)
            }
        }
        reader.readAsDataURL(new Blob([data], { type: mime }))
    })
}
  
export async function dataUrlDecode(dataUrl:string):Promise<string> {
    return fetch(dataUrl).then(response => response.text());
  }
  
export async function dataUrlDecodeAsBlob(dataUrl:string):Promise<Blob> {
    return fetch(dataUrl).then(response => response.blob());
} 

export function arrayBufferToString(buf:ArrayBuffer) {    
    return String.fromCharCode.apply(null, Buffer.from(buf).toJSON().data)
}

export function arrayBufferToStringLarge(buf:ArrayBuffer) {
    const result = []
    const len = 1024
    for (let p = 0; p < buf.byteLength; p += len) {
        result.push(arrayBufferToString(buf.slice(p, p + len)));
    }
    return result.join("");
}

/************************************************************************************************ 
File Path
************************************************************************************************/

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

export function getFileName(filePath:string):string {
    return splitPath(filePath)?.pop() || ""
}

/************************************************************************************************ 
Markdown File
************************************************************************************************/

export function makeMarkdownFileRegexChecker(regexList:string[]):(name:string)=>boolean {
    return function (name:string) {
        for (const regex of regexList.map((re:string)=>new RegExp(re, "i"))) {
            if (name.match(regex)) {
                return true
            }
        }
        return false
    }
}