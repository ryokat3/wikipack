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
    return fetch(dataUrl).then(response => response.text())
}
  
export async function dataUrlDecodeAsBlob(dataUrl:string):Promise<Blob> {
    return fetch(dataUrl).then(response => response.blob())
} 

export async function dataUrlDecodeAsArrayBuffer(dataUrl:string):Promise<ArrayBuffer> {
    return fetch(dataUrl).then(response => response.arrayBuffer())
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

export function splitPath(pathName:string|undefined|null):string[] {
    return pathName ? pipe(
        pathName.split('/'),
        (pathList:string[]) => pathList.length > 0 ? O.some(pathList) : O.none,     
        O.map((pathList:string[])=> pathList.filter((name:string)=>name !== "." && name !== '')), 
        O.map((pathList:string[])=> removeParentDir(pathList)), 
        O.getOrElse(()=>[] as string[])
    ) : []
}

export function addPath(dirName:string|undefined|null, fileName:string):string {
    return splitPath(`${dirName ? dirName + "/" : ""}${fileName}`).join("/")
}

export function canonicalFileName(fileName:string|undefined|null):string {
    return fileName ? isURL(fileName) ? fileName : splitPath(fileName).join("/") : ""
}

export function getDir(fileName:string|undefined|null):string {
    return splitPath(fileName).slice(0,-1).join('/')
}

export function getFileName(filePath:string|undefined|null):string {
    return splitPath(filePath).pop() || ""
}

export function addPathToUrl(urlStr:string, fileName:string, isMarkdownFile:(name:string)=>boolean):string {
    const url = new URL(urlStr)
    url.pathname = "/" + (isMarkdownFile(url.pathname) ? getDir(url.pathname) : canonicalFileName(url.pathname)) + "/" + fileName
    return url.toString()
}

/************************************************************************************************ 
Markdown File
************************************************************************************************/

export function makeFileRegexChecker(regexList:string[]):(name:string)=>boolean {
    const compiledRegexList = regexList.map((re)=>new RegExp(re, "i"))
    return function (name:string) {
        //for (const regex of regexList.map((re:string)=>new RegExp(re, "i"))) {
        for (const regex of compiledRegexList) {            
            if (name.match(regex)) {
                return true
            }
        }
        return false
    }
}

/************************************************************************************************ 
URL
************************************************************************************************/

export function isURL(url:string):boolean {
    try {
        new URL(url);
        return true;
    } catch (err) {
        return false;
    }   
}

export function parseQuery(queryStr:string) {
    return [ ...(new URLSearchParams(queryStr)).entries() ].reduce((obj, e)=>({ ...obj, [e[0]]:e[1] }), Object.create(null))    
}