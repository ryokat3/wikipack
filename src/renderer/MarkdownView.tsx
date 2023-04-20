import React from "react"
import { getRenderer } from "../markdown/converter"
import { Folder } from "../markdown/FileTree"

export interface MarkdownViewProps {
    markdownData: string,
    rootFolder: Folder,
    isMarkdown: (fileName:string)=>boolean
}

export const MarkdownView: React.FunctionComponent<MarkdownViewProps> = (props: MarkdownViewProps) => {    
    const result = getRenderer(props.rootFolder, props.isMarkdown)(props.markdownData)
    return <div dangerouslySetInnerHTML={{__html: result.html}}></div>
}