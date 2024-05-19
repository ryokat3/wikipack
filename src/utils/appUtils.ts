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

/************************************************************************************************ 
Random
************************************************************************************************/

export function randomString(n:number=32):string {
    const CHARS="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return Array.from(Array(n)).map(()=>CHARS[Math.floor(Math.random()*CHARS.length)]).join('')
}

/************************************************************************************************ 
DeepEqual
************************************************************************************************/

export function deepEqual(d1:any, d2:any):boolean {
    const t1 = typeof d1
    const t2 = typeof d2

    if (t1 !== t2) {
        return false
    }
    else if (t1 === 'bigint' || t1 === 'boolean' || t1 === 'number' || t1 === 'string' || t1 === 'symbol' || t1 === 'undefined') {
        return d1 === d2
    }
    else if (d1 === null || d1 === undefined) {
        return d1 === d2
    }
    else if (Array.isArray(d1) !== Array.isArray(d2)) {
        return false
    }
    else if (Array.isArray(d1)) {
        if (d1.length !== d2.length) {
            return false
        }
        else {
            return d1.every((val, idx)=>deepEqual(val, d2[idx]))
        }
    }
    else if (t1 === 'object') {
        if (!deepEqual(Object.keys(d1).sort(), Object.keys(d2).sort())) {
            return false
        }
        else {
            return Object.keys(d1).every((key)=>deepEqual(d1[key], d2[key]))
        }
    }
    else if (t1 === 'function') {
        // TODO: is it OK ?
        return d1 == d2
    }
    else {
        throw new Error('Unknown type for deepEqual')
    }
}