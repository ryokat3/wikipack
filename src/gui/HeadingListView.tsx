import React from "react"
import { List, ListItem } from "@mui/material"
import { HeadingTokenType } from "../fileTree/WikiFile"
import { TopContext } from "./Top"
import { styled } from "@mui/material/styles"
import { HashInfo } from "../markdown/HashInfo"

export interface HeadingListViewProps {
    currentPage: string,
    headingList: HeadingTokenType[]
}

const StickyList = styled(List)(({})=>({     
    position: "sticky",
    top: 0    
}))

function movePage(currentPage:string, heading:string) {
    const hashInfo = new HashInfo(currentPage, heading)
    window.location.hash = `#${hashInfo.toUrl()}`
}

// {props.headingList.map((token) => <ListItem sx={{ ml: token.depth - 1 }} onClick={() => context.mediator.scrollToElement(token.id)}>{token.text}</ListItem>)}            

export const HeadingListView: React.FunctionComponent<HeadingListViewProps> = (props: HeadingListViewProps) => {
    return <TopContext.Consumer>{(_context) =>                
        <StickyList>            
            {props.headingList.map((token) => <ListItem sx={{ ml: token.depth - 1 }} onClick={() => movePage(props.currentPage, token.id)}>{token.text}</ListItem>)}                        
        </StickyList>               
    }
    </TopContext.Consumer>
}