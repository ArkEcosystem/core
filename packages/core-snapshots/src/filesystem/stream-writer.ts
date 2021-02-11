import fs from "fs-extra";
import { pipeline, Readable, Transform, Writable } from "stream";
import zlib from "zlib";

import { Stream as StreamContracts } from "../contracts";
import { Stream as StreamExceptions } from "../exceptions";
import { TransformEncoder } from "./transform-encoder";
import { removeListeners } from "./utils";

export class StreamWriter {
    public count: number = 0;

    private writeStream?: Writable;

    public constructor(
        private dbStream: Readable,
        private path: string,
        private useCompression: boolean,
        private encode: Function,
    ) {
        /* istanbul ignore next */
        process.on("exit", () => {
            this.destroyStreams();
        });
    }

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

                this.destroyStreams();
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

            this.dbStream.on("data", () => {
                this.count++;
            });

            const transforms: Transform[] = [new TransformEncoder(this.encode)];

            if (this.useCompression) {
                transforms.push(zlib.createGzip());
            }

            // @ts-ignore
            pipeline(this.dbStream, ...transforms, this.writeStream, (err) => {
                this.destroyStreams();

                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    private destroyStreams(): void {
        this.dbStream.destroy();
        this.writeStream!.destroy();
    }
}
