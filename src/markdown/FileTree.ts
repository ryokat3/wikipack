export type DataFile = {
    type: "data",
    data: ArrayBuffer | undefined
}

export type MarkdownFile = {
    type: "markdown",
    markdown: string | undefined,
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

function splitPath(pathName:string):string[] {
    return pathName.split('/').filter((name:string)=>name !== '')
}

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

export function getOrCreateMarkdownFile(folder:Folder, pathName:string|string[]):MarkdownFile {
    if (typeof pathName === 'string') {
        return getOrCreateMarkdownFile(folder, splitPath(pathName))
    }
    else if ((pathName.length == 1) && (pathName[0] in folder.children) && (folder.children[pathName[0]].type === "markdown")) {
        return folder.children[pathName[0]] as MarkdownFile
    }
    else if (pathName.length == 1) {
        const markdownFile:MarkdownFile = {
            type: "markdown",
            markdown: undefined,
            imageList: [],
            linkList: []
        }
        folder.children[pathName[0]] = markdownFile
        return markdownFile
    }
    else {
        return getOrCreateMarkdownFile(getOrCreateFolder(folder, pathName[0]), pathName.slice(1))
    }
}

export function getOrCreateDataFile(folder:Folder, pathName:string|string[]):DataFile {
    if (typeof pathName === 'string') {
        return getOrCreateDataFile(folder, splitPath(pathName))
    }
    else if ((pathName.length == 1) && (pathName[0] in folder.children) && (folder.children[pathName[0]].type === "data")) {
        return folder.children[pathName[0]] as DataFile
    }
    else if (pathName.length == 1) {
        const dataFile:DataFile = {
            type: "data",                        
            data: undefined
        }
        folder.children[pathName[0]] = dataFile
        return dataFile
    }
    else {
        return getOrCreateDataFile(getOrCreateFolder(folder, pathName[0]), pathName.slice(1))
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

export function getAnyMarkdownFile(folder:Folder, pathName:string|undefined = undefined):[string, MarkdownFile]|undefined {
    for (const [name, value] of Object.entries(folder.children)) {
        const childName = pathName !== undefined ? pathName + "/" + name : name
        if (value.type == "markdown") {
            return [childName, value]
        }
        else if (value.type == "folder") {
            const result = getAnyMarkdownFile(value, childName)
            if (result !== undefined) {
                return result
            }
        }
    }
    return undefined
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