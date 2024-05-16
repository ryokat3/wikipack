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
    updateDiffId: {
        diffId: string
    },
    updateSeq: {        
        seq: number
    }
}
