import { Transform, TransformCallback } from "stream"
import ByteBuffer from "bytebuffer";

export class TransformEncoder extends Transform {
    public constructor(private encode: Function) {
        super({objectMode: true});
    }

    public _transform(chunk: any, encoding: string, callback: TransformCallback): void {
        let encoded: Buffer = this.encode(chunk);

        let buffer: ByteBuffer = new ByteBuffer(4 + encoded.length, true);

        buffer.writeUInt32(encoded.length)
        buffer.append(encoded)

        this.push(buffer.buffer);

        callback();
    }
}
