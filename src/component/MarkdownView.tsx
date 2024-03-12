import React from "react"
import { getRenderer } from "../markdown/converter"
import { FolderType } from "../data/FileTreeType"
// import { useMemo, useState } from "react"

export interface MarkdownViewProps {
    markdownData: string,
    rootFolder: FolderType,
    filePath: string,
    isMarkdown: (fileName:string)=>boolean
}

export const MarkdownView: React.FunctionComponent<MarkdownViewProps> = (props: MarkdownViewProps) => {    
    const html = getRenderer(props.rootFolder, props.filePath, props.isMarkdown)(props.markdownData)
    return <div dangerouslySetInnerHTML={{__html: html}}></div>
}