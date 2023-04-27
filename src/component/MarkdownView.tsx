import React from "react"
import { getRenderer } from "../markdown/converter"
import { FolderType } from "../data/FileTreeType"

export interface MarkdownViewProps {
    markdownData: string,
    rootFolder: FolderType,
    filePath: string,
    isMarkdown: (fileName:string)=>boolean
}

export const MarkdownView: React.FunctionComponent<MarkdownViewProps> = (props: MarkdownViewProps) => {    
    const result = getRenderer(props.rootFolder, props.filePath, props.isMarkdown)(props.markdownData)
    return <div dangerouslySetInnerHTML={{__html: result.html}}></div>
}