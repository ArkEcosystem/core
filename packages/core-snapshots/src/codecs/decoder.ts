import ByteBuffer from "bytebuffer";

export class Decoder {
    private isEnd = false;

    // @ts-ignore
    public constructor(private readStream: NodeJS.ReadableStream, private decode: Function) {}

    async readNext(): Promise<any> {
        if(this.isEnd) {
            return null;
        }

        await this.waitUntilOpen();

        let chunk: Buffer | null = null;
        while(chunk === null) {
            // @ts-ignore
            chunk = this.readStream.read(4)
        }
        let bbChunk = ByteBuffer.fromBinary(chunk, true);
        let length = bbChunk.readUint32();

        console.log("Data length: ", length);

        if (length === 0) {
            this.isEnd = true;
            return null;
        }


        let dataChunk: Buffer | null = null;
        while(dataChunk === null) {
            // @ts-ignore
            dataChunk = this.readStream.read(length)
        }
        // let bbDataChunk = ByteBuffer.fromBinary(dataChunk, true);
        // let length = bbChunk.readUint32();

        let decoded = this.decode(dataChunk.toString())

        // console.log("Decoded: ", decoded)
        // console.log("Data: ", bbDataChunk.buffer.toString());


        return decoded;
    }

    private waitUntilOpen(): Promise<void> {

        // this.readStream.readable;

        return new Promise((resolve) => {
            this.readStream.once("readable", () => { resolve() });
        })
    }
}

// export class Decoder extends Transform {
//     // private chunk: any;
//     // private callback: Function | undefined = undefined;
//
//     public bytesRead: number = 0;
//     public path: string = "";
//
//     public constructor() {
//         super({objectMode: false});
//     }
//
//     public _transform(chunk: any, encoding: string, callback: TransformCallback): void {
//         console.log("CHUNK: ", chunk.toString(), "CHUNK END");
//
//         this.push(chunk)
//
//         callback();
//     }
//
//     public close() {}
// }
