import React from "react"
import { List, ListItem } from "@mui/material"
import { HeadingTokenType } from "../fileTree/WikiFile"
import { TopContext } from "./Top"

export interface HeadingListViewProps {
    headingList: HeadingTokenType[]
}

export const HeadingListView: React.FunctionComponent<HeadingListViewProps> = (props: HeadingListViewProps) => {
    return <TopContext.Consumer>{(context) =>
    <List>{props.headingList.map((token)=><ListItem sx={{ ml:token.depth-1 }} onClick={()=>context.mediator.scrollToElement(token.id)}>{token.text}</ListItem>)}</List>}</TopContext.Consumer>
}