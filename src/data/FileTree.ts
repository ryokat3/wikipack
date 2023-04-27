import { splitPath } from "../utils/appUtils"

/*
type FileTypeBase = {
    markdown: {
        type: "markdown"
    },
    css: {
        type: "css"
    },
    data: {
        type: "data"
    }
}
*/

type FileTypeBaseBase<T extends string> = {
    [key in T]: {
        // type: keyof FileTypeBaseBase<T>
        type: key
    }
}

type FileTypeBase = FileTypeBaseBase<"markdown" | "css" | "data">

export type FolderBase<FT extends FileTypeBase> = {
    type: "folder",
    parent: FolderBase<FT> | undefined,
    children: {
        [key:string]: FT[keyof FileTypeBase] | FolderBase<FT>
    }
}

/*
export type FolderBase<T extends string> = {
    type: "folder",
    parent: FolderBase<T> | undefined,
    children: {
        [key:string]: FileTypeBaseBase<T>[keyof FileTypeBaseBase<T>] | FolderBase<T>
    }
}
*/

export function createRootFolder<FT extends FileTypeBase>():FolderBase<FT> {
    return {
        type: "folder",
        parent: undefined,
        children: Object.create(null)
    }
}

function getOrCreateFolder<FT extends FileTypeBase>(folder:FolderBase<FT>, name:string):FolderBase<FT> {
    if ((name in folder.children) && (folder.children[name].type === "folder")) {
        return folder.children[name] as FolderBase<FT>
    }    
    folder.children[name] = {
        type: "folder",
        parent: folder,
        children: Object.create(null)
    }
    return folder.children[name] as FolderBase<FT>
}

export function updateFile<FT extends FileTypeBase>(folder:FolderBase<FT>, pathName:string|string[], file:FT[keyof FileTypeBase]):void {
    if (typeof pathName === 'string') {
        return updateFile(folder, splitPath(pathName), file)
    }
    else if (pathName.length == 1) {
        // TODO: Not use 'as any'
        folder.children[pathName[0]] = file as any
    }
    else {
        return updateFile(getOrCreateFolder(folder, pathName[0]), pathName.slice(1), file)
    }
}

export function getFile<FT extends FileTypeBase>(folder:FolderBase<FT>, pathName:string|string[]):FT[keyof FT]|FolderBase<FT>|undefined {
    if (typeof pathName === 'string') {
        return getFile(folder, splitPath(pathName))
    }
    else if ((pathName.length == 1) && (pathName[0] in folder.children)) {
        return folder.children[pathName[0]]
    }
    else if ((pathName.length > 1) && (pathName[0] in folder.children) && (folder.children[pathName[0]].type === "folder")) {
        return getFile(folder.children[pathName[0]] as FolderBase<FT>, pathName.slice(1))
    }
    else {
        return undefined
    }
}

export function deleteFile<FT extends FileTypeBase>(folder:FolderBase<FT>, pathName:string|string[]):void {
    if (typeof pathName === 'string') {
        deleteFile(folder, splitPath(pathName))
    }
    else if ((pathName.length == 1) && (pathName[0] in folder.children)) {
        delete folder.children[pathName[0]]
    }
    else if ((pathName.length > 1) && (pathName[0] in folder.children) && (folder.children[pathName[0]].type === "folder")) {
        deleteFile(folder.children[pathName[0]] as FolderBase<FT>, pathName.slice(1))
    }
}
