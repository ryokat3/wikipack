import { PageTreeFolderType} from "../fileTree/PageTree"
import { HeadingTokenType } from "../fileTree/WikiFile"

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
    updateMenuRoot: {
        menuRoot: PageTreeFolderType
    },
    updateHeadingList: {
        headingList: HeadingTokenType[]
    }
}
