import ByteBuffer from "bytebuffer";
import { Transform, TransformCallback } from "stream";

export class TransformEncoder extends Transform {
    public constructor(private encode: Function) {
        super({ objectMode: true });
    }

    public _transform(chunk: any, encoding: string, callback: TransformCallback): void {
        const encoded: Buffer = this.encode(chunk);

        const buffer: ByteBuffer = new ByteBuffer(4 + encoded.length, true);

        buffer.writeUint32(encoded.length);
        buffer.append(encoded);

        this.push(buffer.buffer);

        callback();
    }
}
