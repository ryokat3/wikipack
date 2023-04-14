export type DataFile = {
    data: ArrayBuffer | undefined
}
export type MarkdownFile = {
    markdown: string | undefined,
    imageList: {
        [name:string]: DataFile | undefined
    },
    linkList: {
        [name:string]: MarkdownFile | undefined
    }
}
export type FileTree = {
    ".": FileTree,
    "..": FileTree,
    [name:string]: DataFile | MarkdownFile | FileTree
}

export type FileType = FileTree | MarkdownFile | DataFile

function isFileTree(obj:FileType):obj is FileTree {
    if ((obj === null) || (typeof obj !== 'object')) {
        return false
    }
    else if (('.' in obj) && ('..' in obj)) {
        return true
    }
    else {
        return false
    }
}

function splitPath(pathName:string):string[] {
    return pathName.split('/').filter((name:string)=>name !== '')
}

export function getFile(root:FileType|undefined, pathName:string|string[]):FileType|undefined {
    if (root === undefined) {
        return undefined
    }
    else if (typeof pathName === 'string') {
        return getFile(root, splitPath(pathName))
    }
    else if (pathName.length == 0) {
        return root
    }
    else if (isFileTree(root) && (pathName[0] in root)) {
        return getFile(root[pathName[0]], pathName.slice(1))
    }
    else {
        return undefined
    }
}