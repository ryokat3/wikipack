import { splitPath, addPath } from "../utils/appUtils"

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

export function isFileTreeFolder<FT extends FileTreeFileType>(target:FT[keyof FT] | FileTreeFolderType<FT>):target is FileTreeFolderType<FT> {
    return target.type === 'folder'
}

export function isEmptyFileTreeFolder<FT extends FileTreeFileType>(folder:FileTreeFolderType<FT>):boolean {
    return isFileTreeFolder(folder) && Object.keys(folder.children).length === 0
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

export function updateFileOfTree<FT extends FileTreeFileType>(
    folder:FileTreeFolderType<FT>,
        pathName:string|string[],
        file:FT[keyof FT],
        isSameFunction:(oldF:FileTreeFolderType<FT>|FT[keyof FT], newF:FT[keyof FT])=>boolean = (_o, _f)=>false
    ):boolean {
    if (typeof pathName === 'string') {
        return updateFileOfTree(folder, splitPath(pathName), file, isSameFunction)
    }
    else if (pathName.length == 1) {
        const result = (pathName[0] in folder.children) && isSameFunction(folder.children[pathName[0]], file)
        folder.children[pathName[0]] = file
        return result
    }
    else {
        return updateFileOfTree(getOrCreateFolder(folder, pathName[0]), pathName.slice(1), file, isSameFunction)
    }
}

export async function reduceFileOfTree<FT extends FileTreeFileType, VALUE>(
    folder:FileTreeFolderType<FT>,
    folderName:string,
    func: (fileName:string, file:FT[keyof FT], value:Promise<VALUE>)=>Promise<VALUE>,
    value: Promise<VALUE>
):Promise<VALUE> {
    return await Object.entries(folder.children).reduce<Promise<VALUE>>(async (v, [name, child]) => {
        const childName = addPath(folderName, name)
        if (child.type === "folder" ) {            
            return await reduceFileOfTree(child as FileTreeFolderType<FT>, childName, func, v)
        }
        else {
            return await func(childName, child as FT[keyof FT], v)
        }
    }, value)
}

export function getFileFromTree<FT extends FileTreeFileType>(folder:FileTreeFolderType<FT>, pathName:string|string[]):FT[keyof FT] | FileTreeFolderType<FT> |undefined {
    if (typeof pathName === 'string') {
        return getFileFromTree(folder, splitPath(pathName))
    }
    else if ((pathName.length == 1) && (pathName[0] in folder.children)) {
        return folder.children[pathName[0]]
    }
    else if ((pathName.length > 1) && (pathName[0] in folder.children) && (folder.children[pathName[0]].type === "folder")) {
        return getFileFromTree(folder.children[pathName[0]] as FileTreeFolderType<FT>, pathName.slice(1))
    }
    else if (pathName.length == 0) {
        return folder
    }
    else {
        return undefined
    }
}

export function deleteFileFromTree<FT extends FileTreeFileType>(folder:FileTreeFolderType<FT>, pathName:string|string[]):void {
    if (typeof pathName === 'string') {
        deleteFileFromTree(folder, splitPath(pathName))
    }
    else if ((pathName.length == 1) && (pathName[0] in folder.children)) {
        delete folder.children[pathName[0]]
    }
    else if ((pathName.length > 1) && (pathName[0] in folder.children) && (folder.children[pathName[0]].type === "folder")) {
        deleteFileFromTree(folder.children[pathName[0]] as FileTreeFolderType<FT>, pathName.slice(1))
    }
}

export function convertFileTree<FT extends FileTreeFileType, FT2 extends FileTreeFileType>(
    folder:FileTreeFolderType<FT>,
    convert:(src:FT[keyof FT])=>FT2[keyof FT2],
    parent:FileTreeFolderType<FT2>|undefined = undefined
):FileTreeFolderType<FT2> {    
    const newFolder:FileTreeFolderType<FT2> = {
        ...folder,
        parent: parent,
        children: {}
    }
    newFolder.children = Object.fromEntries(Object.entries(folder.children).map(([fileName, fileInfo])=>{
        return [fileName, isFileTreeFolder(fileInfo) ? convertFileTree(fileInfo, convert, newFolder) : convert(fileInfo)]
    }))
    return newFolder
}
