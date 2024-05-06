import { FileTreeFolderType } from "./FileTree"
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