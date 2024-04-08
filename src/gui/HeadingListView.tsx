import React from "react"
import { List, ListItem } from "@mui/material"
import { HeadingTokenType } from "../fileTree/WikiFile"

export interface HeadingListViewProps {
    headingList: HeadingTokenType[]
}

export const HeadingListView: React.FunctionComponent<HeadingListViewProps> = (props: HeadingListViewProps) => {
    return <List>{props.headingList.map((token)=><ListItem sx={{ ml:token.depth-1 }}>{token.text}</ListItem>)}</List>    
}