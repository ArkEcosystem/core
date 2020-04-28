import ByteBuffer from "bytebuffer";
import fs from "fs-extra";

import { Stream as StreamExceptions } from "../exceptions";

export class StreamReader {
    private isEnd = false;
    private readStream: NodeJS.ReadableStream | undefined;

    public constructor(private path: string, private decode: Function) {}

    public open(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.readStream = fs.createReadStream(this.path);

            let clean = () => {
                this.readStream!.removeListener("open", onOpen);
                this.readStream!.removeListener("error", onError);
            }

            let onOpen = () => {
                clean();
                resolve();
            }

            let onError = (err) => {
                clean();
                reject(err);
            }

            this.readStream.once("open", onOpen)
            this.readStream.once("error", onError)
        })
    }


    async readNext(): Promise<any> {
        if (!this.readStream) {
            throw new StreamExceptions.StreamNotOpen(this.path);
        }

        if(this.isEnd) {
            return null;
        }

        await this.waitUntilReady();

        let lengthChunk: Buffer | null = null;
        while(lengthChunk === null) {
            lengthChunk = this.readStream.read(4) as Buffer;
        }

        let lengthChunkBuffer = ByteBuffer.fromBinary(lengthChunk, true);
        let length = lengthChunkBuffer.readUint32();

        if (length === 0) {
            this.isEnd = true;
            return null;
        }

        let dataChunk: Buffer | null = null;
        while(dataChunk === null) {
            dataChunk = this.readStream.read(length) as Buffer;
        }

        return this.decode(dataChunk);
    }

    private waitUntilReady(): Promise<void> {
        return new Promise((resolve) => {
            this.readStream!.once("readable", () => { resolve() });
        })
    }
}
