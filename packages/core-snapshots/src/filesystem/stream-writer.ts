import { TransformEncoder } from "./transform-encoder";
import fs from "fs-extra";
import zlib from "zlib";

import { Stream as StreamExceptions } from "../exceptions";

export class StreamWriter {
    public count: number = 0;

    private writeStream: NodeJS.WritableStream | undefined;

    // @ts-ignore
    public constructor(private dbStream: NodeJS.ReadableStream, private path: string, private useCompression: boolean, private encode: Function) {}

    public open(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.writeStream = fs.createWriteStream(this.path);

            let onOpen = () => {
                removeListeners();
                resolve();
            }

            /* istanbul ignore next */
            let onError = (err) => {
                removeListeners();
                reject(err);
            }

            let removeListeners = () => {
                this.writeStream!.removeListener("open", onOpen);
                this.writeStream!.removeListener("error", onError);
            }

            this.writeStream.once("open", onOpen)
            this.writeStream.once("error", onError)
        })
    }

    public write(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!this.writeStream) {
                throw new StreamExceptions.StreamNotOpen(this.path);
            }

            let transformer = new TransformEncoder(this.encode);

            let stream;
            if (this.useCompression) {
                stream = this.dbStream
                    .pipe(transformer)
                    .pipe(zlib.createGzip())
            } else {
                stream = this.dbStream
                    .pipe(transformer)
            }

            let removeListeners = () => {
                stream.removeListener("data", onData);
                stream.removeListener("end", onEnd);
                stream.removeListener("error", onError);
            }

            let onData = (data) => {
                this.writeStream!.write(data)
                this.count++;
            }

            let onEnd = () => {
                removeListeners();
                this.writeStream!.end(() => {
                    resolve();
                });
            }

            /* istanbul ignore next */
            let onError = (err) => {
                removeListeners();
                reject(err);
            }

            stream.on("data", onData);

            stream.once("end", onEnd)

            stream.once("error", onError)
        })
    }
}
