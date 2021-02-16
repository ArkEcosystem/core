import { Worker } from "@packages/core-snapshots/src/contracts";
import { Readable } from "stream";
import WorkerThreads from "worker_threads";
import { decamelize } from "xcase";

import { Assets } from "../../../__fixtures__";

export class ReadableStream extends Readable {
    private count = 0;

    public constructor(private prefix: string, private table: string) {
        super({ objectMode: true });
    }

    public _read(): void {
        if (this.count !== Assets[this.table].length) {
            this.push(this.appendPrefix(Assets[this.table][this.count]));
            this.count++;
        } else {
            this.push(null);
        }
    }

    private appendPrefix(entity: any) {
        const itemToReturn = {};

        const item = entity;

        for (const key of Object.keys(item)) {
            itemToReturn[this.prefix + decamelize(key)] = item[key];
        }

        return itemToReturn;
    }
}

export const waitForMessage = (action: Worker.WorkerAction, actionName: string, params: any): Promise<void> => {
    return new Promise<void>((resolve) => {
        WorkerThreads.parentPort!.once("message", (data) => {
            resolve(data);
        });

        action[actionName](params);
    });
};
