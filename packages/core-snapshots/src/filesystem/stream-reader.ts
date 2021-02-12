import ByteBuffer from "bytebuffer";
import fs from "fs-extra";
import { pipeline, Readable } from "stream";
import zlib from "zlib";

import { Stream as StreamContracts } from "../contracts";
import { Stream as StreamExceptions } from "../exceptions";
import { removeListeners } from "./utils";

export class StreamReader {
    public count: number = 0;

    private isEnd = false;
    private readStream?: Readable;
    private stream?: Readable;

    private buffer: ByteBuffer = new ByteBuffer(0);
    private offset = 0;
    private length = 0;

    public constructor(private path: string, private useCompression: boolean, private decode: Function) {
        /* istanbul ignore next */
        process.on("exit", () => {
            this.destroyStreams();
        });
    }

    public open(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.readStream = fs.createReadStream(this.path);

            if (this.useCompression) {
                this.stream = pipeline(this.readStream, zlib.createGunzip(), () => {});
            } else {
                this.stream = this.readStream;
            }

            const eventListenerPairs = [] as StreamContracts.EventListenerPair[];

            const onOpen = () => {
                removeListeners(this.readStream!, eventListenerPairs);
                resolve();
            };

            const onError = (err) => {
                removeListeners(this.readStream!, eventListenerPairs);

                this.destroyStreams();
                reject(err);
            };

            eventListenerPairs.push({ event: "open", listener: onOpen });
            eventListenerPairs.push({ event: "error", listener: onError });

            this.readStream.on("open", onOpen);
            this.readStream.on("error", onError);

            this.stream.on("end", () => {
                this.isEnd = true;
                this.destroyStreams();
            });
        });
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

        const length = lengthChunk.readUint32();

        const dataChunk = await this.read(length);

        this.count++;
        return this.decode(dataChunk.buffer);
    }

    private async readNextChunk(): Promise<void> {
        if (this.isEnd) {
            throw new StreamExceptions.EndOfFile(this.path);
        }

        if (!this.stream) {
            throw new StreamExceptions.StreamNotOpen(this.path);
        }

        await this.waitUntilReadable();

        const chunk: Buffer | null = this.stream.read() as Buffer;

        if (chunk === null) {
            throw new StreamExceptions.EndOfFile(this.path);
        }

        this.buffer = new ByteBuffer(chunk.length, true);
        this.buffer.append(chunk);
        this.length = this.buffer.capacity();
        this.offset = 0;
    }

    private waitUntilReadable(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const eventListenerPairs = [] as StreamContracts.EventListenerPair[];

            const onReadable = () => {
                removeListeners(this.stream!, eventListenerPairs);
                resolve();
            };

            /* istanbul ignore next */
            const onError = () => {
                removeListeners(this.stream!, eventListenerPairs);

                this.destroyStreams();
                reject(new Error("Error on stream"));
            };

            const onEnd = () => {
                removeListeners(this.stream!, eventListenerPairs);

                this.destroyStreams();
                reject(new StreamExceptions.EndOfFile(this.path));
            };

            eventListenerPairs.push({ event: "readable", listener: onReadable });
            eventListenerPairs.push({ event: "error", listener: onError });
            eventListenerPairs.push({ event: "end", listener: onEnd });

            this.stream!.once("readable", onReadable);

            this.stream!.once("error", onError);

            this.stream!.once("end", onEnd);
        });
    }

    private async read(size: number): Promise<ByteBuffer> {
        const bufferToReturn = new ByteBuffer(size, true);

        let remaining = size;
        while (remaining > 0) {
            if (this.offset === this.length) {
                await this.readNextChunk();
            }

            let copyLength = 0;
            /* istanbul ignore next */
            if (this.offset + remaining <= this.length) {
                copyLength = remaining;
            } else {
                /* istanbul ignore next */
                copyLength = this.length - this.offset;
            }

            bufferToReturn.append(this.buffer.copy(this.offset, this.offset + copyLength));
            this.offset += copyLength;
            remaining -= copyLength;
        }

        bufferToReturn.reset();
        return bufferToReturn;
    }

    private destroyStreams(): void {
        /* istanbul ignore next */
        this.readStream?.destroy();
    }
}
