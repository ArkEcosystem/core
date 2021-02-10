import fs from "fs-extra";
import zlib from "zlib";

import { Stream as StreamContracts } from "../contracts";
import { Stream as StreamExceptions } from "../exceptions";
import { TransformEncoder } from "./transform-encoder";
import { removeListeners } from "./utils";

export class StreamWriter {
    public count: number = 0;

    private writeStream: NodeJS.WritableStream | undefined;

    // @ts-ignore
    public constructor(
        private dbStream: NodeJS.ReadableStream,
        private path: string,
        private useCompression: boolean,
        private encode: Function,
    ) {}

    public open(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.writeStream = fs.createWriteStream(this.path);

            const eventListenerPairs = [] as StreamContracts.EventListenerPair[];

            const onOpen = () => {
                removeListeners(this.writeStream!, eventListenerPairs);
                resolve();
            };

            /* istanbul ignore next */
            const onError = (err) => {
                removeListeners(this.writeStream!, eventListenerPairs);
                reject(err);
            };

            eventListenerPairs.push({ event: "open", listener: onOpen });
            eventListenerPairs.push({ event: "error", listener: onError });

            this.writeStream.once("open", onOpen);
            this.writeStream.once("error", onError);
        });
    }

    public write(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!this.writeStream) {
                throw new StreamExceptions.StreamNotOpen(this.path);
            }

            const transformer = new TransformEncoder(this.encode);

            let stream;
            if (this.useCompression) {
                stream = this.dbStream.pipe(transformer).pipe(zlib.createGzip());
            } else {
                stream = this.dbStream.pipe(transformer);
            }

            const eventListenerPairs = [] as StreamContracts.EventListenerPair[];

            const onData = (data) => {
                this.writeStream!.write(data);
            };

            const onEnd = () => {
                removeListeners(stream, eventListenerPairs);
                this.writeStream!.end(() => {
                    resolve();
                });
            };

            /* istanbul ignore next */
            const onError = (err) => {
                removeListeners(stream, eventListenerPairs);
                reject(err);
            };

            eventListenerPairs.push({ event: "data", listener: onData });
            eventListenerPairs.push({ event: "error", listener: onError });
            eventListenerPairs.push({ event: "end", listener: onEnd });

            this.dbStream.on("data", () => {
                this.count++;
            });

            stream.on("data", onData);

            stream.once("end", onEnd);

            stream.once("error", onError);
        });
    }
}
