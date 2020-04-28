import { Transform, TransformCallback } from "stream"
import ByteBuffer from "bytebuffer";

export class TransformEncoder extends Transform {
    constructor(private encode: Function) {
        super({objectMode: true});
    }

    _transform(chunk: any, encoding: string, callback: TransformCallback): void {
        let encoded: Buffer = this.encode(chunk);

        let buffer: ByteBuffer = new ByteBuffer(4 + encoded.length, true);

        buffer.writeUInt32(encoded.length)
        buffer.append(encoded)

        // console.log("Encoded: ", encoded)
        // console.log("Encoded len: ", encoded.length)
        // console.log("Buffer: ", buffer.buffer)
        // console.log("Buffer Len: ", buffer.capacity())
        //
        // console.log("----")

        this.push(buffer.buffer);

        callback();
    }
}
