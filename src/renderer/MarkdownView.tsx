import React from "react"
import { render } from "../markdown/converter"

export interface MarkdownViewProps {
    markdownData?: string
}

export const MarkdownView: React.FunctionComponent<MarkdownViewProps> = (props: MarkdownViewProps) => {    
    if (props.markdownData === undefined) {
        // TODO: prompt to input markdown 
        return <div>No Markdown found</div>
    }
    else {
        const result = render(props.markdownData)
        return <div dangerouslySetInnerHTML={{__html: result.html}}></div>
    }
}