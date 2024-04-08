import React from "react"

export interface PageViewProps {
    html: string
}

export const PageView: React.FunctionComponent<PageViewProps> = (props: PageViewProps) => {        
    return <div dangerouslySetInnerHTML={{__html: props.html}}></div>
}