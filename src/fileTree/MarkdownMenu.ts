import { FolderType, MarkdownFileType } from "./WikiFile"
import { createRootFolder, FileTreeFolderType } from "./FileTree"

export type MarkdownMenuFileType =  {
    markdown: {
        type: "markdown",
    }
}

export type MarkdownMenuFolderType = FileTreeFolderType<MarkdownMenuFileType>

export function getMarkdownMenu(folder:FolderType):MarkdownMenuFolderType|undefined {

    const menuFolder = createRootFolder<MarkdownMenuFileType>()
    menuFolder.children = Object.fromEntries(Object.entries(folder.children)
        .filter((entry):entry is [string, FolderType|MarkdownFileType] => entry[1].type === "folder" || entry[1].type === "markdown")
        .map(([name, node])=> (node.type === "folder") ? [name, getMarkdownMenu(node)] : [name, { type: "markdown"}])
        .filter((entry):entry is [string, MarkdownMenuFolderType|MarkdownMenuFileType['markdown']] => entry[1] !== undefined))
    
    return (Object.keys(menuFolder.children).length != 0) ? menuFolder : undefined
}