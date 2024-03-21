import { MarkdownMenuFolderType} from "../fileTree/MarkdownMenu"

export type TopFdt = {
    updatePackFileName: {
        name: string
    },
    updateHtml: {
        title: string,
        html: string
    },
    updateSeq: {        
        seq: number
    },
    updateMenuRoot: {
        menuRoot: MarkdownMenuFolderType
    }
}
