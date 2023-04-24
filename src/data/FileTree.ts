import { splitPath } from "../utils/appUtils"

export type DataFile = {
    type: "data",
    dataRef: string,
    buffer: ArrayBuffer | string,
    timestamp: number,
    mime: string
}

export type MarkdownFile = {
    type: "markdown",
    markdown: string,
    timestamp: number,
    imageList: string[],
    linkList: string[]
}

export type Folder = {
    type: "folder",
    parent: Folder | undefined,
    children: {
        [name:string]: DataFile | MarkdownFile | Folder
    }
}

export type FileType = Folder | MarkdownFile | DataFile


export function createRootFolder():Folder {
    return {
        type: "folder",
        parent: undefined,
        children: Object.create(null)
    }
}

function getOrCreateFolder(folder:Folder, name:string):Folder {
    if ((name in folder.children) && (folder.children[name].type === "folder")) {
        return folder.children[name] as Folder
    }    
    folder.children[name] = {
        type: "folder",
        parent: folder,
        children: Object.create(null)
    }
    return folder.children[name] as Folder
}

export function updateMarkdownFile(folder:Folder, pathName:string|string[], markdownFile:MarkdownFile):void {
    if (typeof pathName === 'string') {
        updateMarkdownFile(folder, splitPath(pathName), markdownFile)
    }
    else if (pathName.length == 1) {
        folder.children[pathName[0]] = markdownFile        
    }
    else {
        updateMarkdownFile(getOrCreateFolder(folder, pathName[0]), pathName.slice(1), markdownFile)
    }
}

export function updateDataFile(folder:Folder, pathName:string|string[], dataFile:DataFile):void {
    if (typeof pathName === 'string') {
        return updateDataFile(folder, splitPath(pathName), dataFile)
    }
    else if (pathName.length == 1) {
        folder.children[pathName[0]] = dataFile
    }
    else {
        return updateDataFile(getOrCreateFolder(folder, pathName[0]), pathName.slice(1), dataFile)
    }
}

export function getFile(folder:Folder, pathName:string|string[]):FileType|undefined {
    if (typeof pathName === 'string') {
        return getFile(folder, splitPath(pathName))
    }
    else if ((pathName.length == 1) && (pathName[0] in folder.children)) {
        return folder.children[pathName[0]]
    }
    else if ((pathName.length > 1) && (pathName[0] in folder.children) && (folder.children[pathName[0]].type === "folder")) {
        return getFile(folder.children[pathName[0]] as Folder, pathName.slice(1))
    }
    else {
        return undefined
    }
}

export function deleteFile(folder:Folder, pathName:string|string[]):void {
    if (typeof pathName === 'string') {
        deleteFile(folder, splitPath(pathName))
    }
    else if ((pathName.length == 1) && (pathName[0] in folder.children)) {
        delete folder.children[pathName[0]]
    }
    else if ((pathName.length > 1) && (pathName[0] in folder.children) && (folder.children[pathName[0]].type === "folder")) {
        deleteFile(folder.children[pathName[0]] as Folder, pathName.slice(1))
    }
}
