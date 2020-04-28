import { TransformEncoder } from "./transform-encoder";
import fs from "fs-extra";

import { Stream as StreamExceptions } from "../exceptions";


export class StreamWriter {
    public count: number = 0;

    private writeStream: fs.WriteStream | undefined;

    public constructor(private dbStream: NodeJS.ReadableStream, private path: string, private encode: Function) {}

    public open(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.writeStream = fs.createWriteStream(this.path);

            let clean = () => {
                this.writeStream!.removeListener("open", onOpen);
                this.writeStream!.removeListener("error", onError);
            }

            let onOpen = () => {
                clean();
                resolve();
            }

            let onError = (err) => {
                clean();
                reject(err);
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

            let stream = this.dbStream
                .pipe(transformer)

            stream.on("data", (data) => {
                this.writeStream!.write(data)
                this.count++;
            })

            stream.once("end", () => {
                this.writeStream!.write(Buffer.alloc(4), () => {
                    this.writeStream!.close()
                    this.writeStream = undefined;

                    resolve();
                });
            })

            stream.once("error", (err) => {
                reject(err);
            })
        })
    }
}
