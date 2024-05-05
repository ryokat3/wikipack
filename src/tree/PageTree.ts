import { FolderType, MarkdownFileType } from "./WikiFile"
import { createRootFolder, FileTreeFolderType } from "./FileTree"
import { HeadingTreeType } from "./WikiFile"

export type HtmlInfo = {
    html:string,
    heading:HeadingTreeType
}

export type PageTreeItemType =  {
    markdown: {
        type: "markdown",
    } & HtmlInfo
}



export type PageTreeFolderType = FileTreeFolderType<PageTreeItemType>

export function getPageTree(folder:FolderType):PageTreeFolderType|undefined {

    const menuFolder = createRootFolder<PageTreeItemType>()
    menuFolder.children = Object.fromEntries(Object.entries(folder.children)
        .filter((entry):entry is [string, FolderType|MarkdownFileType] => entry[1].type === "folder" || entry[1].type === "markdown")
        .map(([name, node])=> (node.type === "folder") ? [name, getPageTree(node)] : [name, { type: "markdown"}])
        .filter((entry):entry is [string, PageTreeFolderType|PageTreeItemType['markdown']] => entry[1] !== undefined))
    
    return (Object.keys(menuFolder.children).length != 0) ? menuFolder : undefined
}