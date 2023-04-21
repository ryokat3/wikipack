import { DataFile, MarkdownFile } from "../markdown/FileTree"
import { EMBEDDED_FILE_ID_PREFIX } from "../constant"
import { dataUrlDecode, dataUrlDecodeAsBlob } from "../utils/browserUtils"
import { getMarkdownFile } from "../markdown/converter"

export function getFileElement(id:string):HTMLElement|null {
    return document.getElementById(EMBEDDED_FILE_ID_PREFIX + id)
}

export function getEmbeddedFile(id:string) {
    const elem = document.getElementById(EMBEDDED_FILE_ID_PREFIX + id)
    return elem !== null ? elem.innerHTML : undefined
}

function getFileNameFromElement(elem:Element):string|undefined {
    const id = elem.getAttribute("id")
    return (id !== null) && id.startsWith(EMBEDDED_FILE_ID_PREFIX) ? id.slice(EMBEDDED_FILE_ID_PREFIX.length) : undefined
}

export async function getMarkdownFileFromElement(elem:Element):Promise<[string, MarkdownFile] | undefined> {    
    const fileName = getFileNameFromElement(elem)

    if (fileName !== undefined) {    
        const markdown = await dataUrlDecode(elem.innerHTML)
        const timestampStr = elem.getAttribute("timestamp")
        const timestamp = (timestampStr !== null) ? parseInt(timestampStr) : 0    

        return [fileName, getMarkdownFile(markdown, fileName, timestamp)]
    }
    else {
        return undefined
    }
}

export async function getDataFileFromElement(elem:Element):Promise<[string, DataFile] | undefined> {
    const fileName = getFileNameFromElement(elem)

    if (fileName !== undefined) {    
        const blob = await dataUrlDecodeAsBlob(elem.innerHTML)
        const dataRef = URL.createObjectURL(blob)
        const timestampStr = elem.getAttribute("timestamp")
        const timestamp = (timestampStr !== null) ? parseInt(timestampStr) : 0    
        const mime = elem.getAttribute("mime") || blob.type

        return [fileName, {
            type: "data",
            dataRef: dataRef,
            buffer: elem.innerHTML,
            timestamp: timestamp,
            mime: mime
        }]
    }
    else {
        return undefined
    }
}