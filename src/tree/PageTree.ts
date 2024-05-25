import { FileTreeFolderType } from "./FileTree"
import { HeadingTreeType } from "./WikiFile"
import { RendererRecord } from "../markdown/markedUtils"

export type HtmlInfo = {
    html:string,
    heading:HeadingTreeType,
    recordList: RendererRecord[]
}

export type PageTreeItemType =  {
    markdown: {
        type: "markdown",
    } & HtmlInfo
}

export type PageTreeFolderType = FileTreeFolderType<PageTreeItemType>