import React from "react"
import { List, ListItem } from "@mui/material"
import { HeadingTokenType } from "../fileTree/WikiFile"
import { TopContext } from "./Top"
import { styled } from "@mui/material/styles"

export interface HeadingListViewProps {
    headingList: HeadingTokenType[]
}

const StickyList = styled(List)(({})=>({     
    position: "sticky",
    top: 0    
}))

export const HeadingListView: React.FunctionComponent<HeadingListViewProps> = (props: HeadingListViewProps) => {
    return <TopContext.Consumer>{(context) =>        
        <StickyList>
            {props.headingList.map((token) => <ListItem sx={{ ml: token.depth - 1 }} onClick={() => context.mediator.scrollToElement(token.id)}>{token.text}</ListItem>)}
        </StickyList>        
    }
    </TopContext.Consumer>
}