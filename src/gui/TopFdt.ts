import { HeadingTreeType } from "../tree/WikiFile"

export type TopFdt = {
    updatePackFileName: {
        name: string
    },
    updateHtml: {
        title: string,
        html: string
    },
    updateHeading: {
        heading: string|undefined
    },
    updateSeq: {        
        seq: number
    },
    updateHeadingList: {
        headingTree: HeadingTreeType
    }
}
