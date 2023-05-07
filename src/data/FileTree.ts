import { splitPath } from "../utils/appUtils"

type FileTreeFileType = {
    [key:string]: {        
        type: keyof FileTreeFileType
    }
}

export type FileTreeFolderType<FT extends FileTreeFileType> = {
    type: "folder",
    parent: FileTreeFolderType<FT> | undefined,
    children: {
        [key:string]: FT[keyof FT] | FileTreeFolderType<FT>
    }
}

export function createRootFolder<FT extends FileTreeFileType>():FileTreeFolderType<FT> {
    return {
        type: "folder",
        parent: undefined,
        children: Object.create(null)
    }
}

function getOrCreateFolder<FT extends FileTreeFileType>(folder:FileTreeFolderType<FT>, name:string):FileTreeFolderType<FT> {
    if ((name in folder.children) && (folder.children[name].type === "folder")) {
        return folder.children[name] as FileTreeFolderType<FT>
    }    
    folder.children[name] = {
        type: "folder",
        parent: folder,
        children: Object.create(null)
    }
    return folder.children[name] as FileTreeFolderType<FT>
}

export function updateFile<FT extends FileTreeFileType>(folder:FileTreeFolderType<FT>, pathName:string|string[], file:FT[keyof FT]):void {
    if (typeof pathName === 'string') {
        return updateFile(folder, splitPath(pathName), file)
    }
    else if (pathName.length == 1) {        
        folder.children[pathName[0]] = file
    }
    else {
        return updateFile(getOrCreateFolder(folder, pathName[0]), pathName.slice(1), file)
    }
}

export function getFile<FT extends FileTreeFileType>(folder:FileTreeFolderType<FT>, pathName:string|string[]):FT[keyof FT] | FileTreeFolderType<FT> |undefined {
    if (typeof pathName === 'string') {
        return getFile(folder, splitPath(pathName))
    }
    else if ((pathName.length == 1) && (pathName[0] in folder.children)) {
        return folder.children[pathName[0]]
    }
    else if ((pathName.length > 1) && (pathName[0] in folder.children) && (folder.children[pathName[0]].type === "folder")) {
        return getFile(folder.children[pathName[0]] as FileTreeFolderType<FT>, pathName.slice(1))
    }
    else if (pathName.length == 0) {
        return folder
    }
    else {
        return undefined
    }
}

export function deleteFile<FT extends FileTreeFileType>(folder:FileTreeFolderType<FT>, pathName:string|string[]):void {
    if (typeof pathName === 'string') {
        deleteFile(folder, splitPath(pathName))
    }
    else if ((pathName.length == 1) && (pathName[0] in folder.children)) {
        delete folder.children[pathName[0]]
    }
    else if ((pathName.length > 1) && (pathName[0] in folder.children) && (folder.children[pathName[0]].type === "folder")) {
        deleteFile(folder.children[pathName[0]] as FileTreeFolderType<FT>, pathName.slice(1))
    }
}
