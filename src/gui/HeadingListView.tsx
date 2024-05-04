import React from "react"
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view'
import { HeadingTreeType } from "../tree/WikiFile"
import { styled } from "@mui/material/styles"
import { HashInfo } from "../markdown/HashInfo"
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

const StickySimpleTreeView = styled(SimpleTreeView)(({})=>({     
    position: "sticky",
    top: 0    
}))

export interface HeadingListViewProps {
    currentPage: string,
    headingTree: HeadingTreeType
}

export const HeadingListView: React.FunctionComponent<HeadingListViewProps> = (props: HeadingListViewProps) => {

    const childrenView = props.headingTree.children.map((child)=>{        
        return <HeadingListView currentPage={props.currentPage} headingTree={child}></HeadingListView>
    })

    const onNodeSelect = (_: React.SyntheticEvent, itemId: string, isSelected:boolean):void =>{
        if (isSelected) {
            new HashInfo(props.currentPage, itemId).apply()
        }
    }

    return (props.headingTree.isRoot) ? <StickySimpleTreeView
        aria-label="file system navigator"
        slots={{ collapseIcon: ChevronRightIcon, expandIcon: ExpandMoreIcon }}
        onItemSelectionToggle={onNodeSelect}
        sx={{ overflow: 'hidden' }}
    >
        {childrenView}
    </StickySimpleTreeView> : <TreeItem itemId={props.headingTree.value.heading.toString()} label={props.headingTree.value.text}>
        {childrenView}
    </TreeItem>                
}