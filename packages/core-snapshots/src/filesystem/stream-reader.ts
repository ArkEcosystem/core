import ByteBuffer from "bytebuffer";
import fs from "fs-extra";
import zlib from "zlib";

import { Stream as StreamExceptions } from "../exceptions";

export class StreamReader {
    public count: number = 0;

    private isEnd = false;
    private readStream: NodeJS.ReadableStream | undefined;

    private buffer: ByteBuffer = new ByteBuffer(0);
    private offset = 0;
    private length = 0;

    public constructor(private path: string, private useCompression: boolean, private decode: Function) {}

    public open(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let readStream = fs.createReadStream(this.path);

            if (this.useCompression) {
                this.readStream = readStream.pipe(zlib.createGunzip())
            } else {
                this.readStream = readStream;
            }

            let removeListeners = () => {
                readStream!.removeListener("open", onOpen);
                readStream!.removeListener("error", onError);
            }

            let onOpen = () => {
                removeListeners();
                resolve();
            }

            let onError = (err) => {
                removeListeners();
                reject(err);
            }

            readStream.once("open", onOpen)
            readStream.once("error", onError)

            this.readStream.on("end", () => {
                this.isEnd = true;
            })
        })
    }


    public async readNext(): Promise<any> {
        let lengthChunk: ByteBuffer;
        try {
            lengthChunk = await this.read(4);
        } catch (err) {
            if (err instanceof StreamExceptions.EndOfFile) {
                this.isEnd = true;
                return null;
            }

            throw err;
        }

        let length = lengthChunk.readUint32();

        let dataChunk = await this.read(length);

        this.count++;
        return this.decode(dataChunk.buffer);
    }

    private async readNextChunk(): Promise<void> {
        if (this.isEnd) {
            throw new StreamExceptions.EndOfFile(this.path)
        }

        if (!this.readStream) {
            throw new StreamExceptions.StreamNotOpen(this.path);
        }

        await this.waitUntilReadable();

        let chunk: Buffer | null = this.readStream.read() as Buffer;


        if (chunk === null) {
            throw new StreamExceptions.EndOfFile(this.path)
        }

        this.buffer = new ByteBuffer(chunk!.length, true);
        this.buffer.append(chunk)
        this.length = this.buffer.capacity();
        this.offset = 0;
    }

    private waitUntilReadable(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let removeListeners = () => {
                this.readStream!.removeListener("readable", onReadable)
                this.readStream!.removeListener("error", onError)
                this.readStream!.removeListener("end", onEnd)
            }

            let onReadable = () => {
                removeListeners();
                resolve();
            }

            /* istanbul ignore next */
            let onError = () => {
                removeListeners();
                reject(new Error("Error on stream"));
            }

            let onEnd = () => {
                removeListeners();
                reject(new StreamExceptions.EndOfFile(this.path));
            }


            this.readStream!.once("readable", onReadable)

            this.readStream!.once("error", onError)

            this.readStream!.once("end", onEnd)
        })
    }

    private async read(size: number): Promise<ByteBuffer> {
        let bufferToReturn = new ByteBuffer(size, true)

        let remaining = size;
        while (remaining > 0) {
            if (this.offset === this.length) {
                await this.readNextChunk();
            }

            let copyLength = 0;
            if (this.offset + remaining <= this.length) {
                copyLength = remaining;
            } else {
                /* istanbul ignore next */
                copyLength = this.length - this.offset;
            }

            bufferToReturn.append(this.buffer.copy(this.offset, this.offset + copyLength))
            this.offset += copyLength;
            remaining -= copyLength;
        }

        bufferToReturn.reset();
        return bufferToReturn;
    }
}
