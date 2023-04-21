
export async function dataUrlEncode(data:string|ArrayBuffer, mime:string):Promise<string|null> {
    return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result)
            }
            else if (reader.result !== null) {
                resolve(arrayBufferToString(reader.result))
            }
            else {
                resolve(null)
            }
        }
        reader.readAsDataURL(new Blob([data], { type: mime }))
    })
}
  
export async function dataUrlDecode(dataUrl:string):Promise<string> {
    return fetch(dataUrl).then(response => response.text());
  }
  
export async function dataUrlDecodeAsBlob(dataUrl:string):Promise<Blob> {
    return fetch(dataUrl).then(response => response.blob());
} 



export function arrayBufferToString(buf:ArrayBuffer) {    
    return String.fromCharCode.apply(null, Buffer.from(buf).toJSON().data)
}

export function arrayBufferToStringLarge(buf:ArrayBuffer) {
    const result = []
    const len = 1024
    for (let p = 0; p < buf.byteLength; p += len) {
        result.push(arrayBufferToString(buf.slice(p, p + len)));
    }
    return result.join("");
}
