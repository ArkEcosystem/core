import { Transform, TransformCallback } from "stream"
import ByteBuffer from "bytebuffer";

export class Encoder {
    public constructor(private dbStream: NodeJS.ReadableStream, private writeStream: NodeJS.WritableStream, private encode: Function) {}

    public write(): Promise<void> {
        return new Promise<void>((resolve) => {
            let transformer = new EncodeTransformer(this.encode);

            let stream = this.dbStream
                .pipe(transformer)
                .pipe(this.writeStream)

            // stream.on("data", (data) => {
            //     console.log("BLOCK", data)
            //
            //     this.writeStream.write(data)
            // })
            //
            // stream.once("end", () => {
            //     console.log("END")
            //
            //     this.writeStream.write("END")
            //
            //     resolve();
            // })

            stream.once("close", () => {
                resolve();
            })
        })
    }


}

export class EncodeTransformer extends Transform {
    constructor(private encode: Function) {
        super({objectMode: true});
    }

    _transform(chunk: any, encoding: string, callback: TransformCallback): void {
        let encoded: Buffer = this.encode(chunk);

        let buffer: ByteBuffer = new ByteBuffer(4 + encoded.length, true);

        buffer.writeUInt32(encoded.length)
        buffer.append(encoded)

        console.log("Encoded: ", encoded)
        console.log("Encoded len: ", encoded.length)
        console.log("Buffer: ", buffer.buffer)
        console.log("Buffer Len: ", buffer.capacity())
        //
        // console.log("----")

        this.push(buffer.buffer);

        callback();
    }
}

// export class Encoder extends Duplex {
//     private chunk: any;
//     private callback: Function | undefined = undefined;
//
//     public constructor() {
//         super({objectMode: true});
//     }
//
//     _write(chunk: any, encoding: string, callback: (error?: (Error | null)) => void): void {
//         // super._write(chunk, encoding, callback);
//
//         console.log("Chunk: ", chunk)
//         this.chunk = chunk;
//
//
//         this.callback = callback;
//         // callback();
//     }
//
//     _read(size: number): any {
//         // super._read(size);
//         if (this.callback) {
//             this.callback();
//         }
//         return this.chunk;
//     }
// }
