import React from "react"

export interface MarkdownViewProps {
    html: string
}

export const MarkdownView: React.FunctionComponent<MarkdownViewProps> = (props: MarkdownViewProps) => {        
    return <div dangerouslySetInnerHTML={{__html: props.html}}></div>
}