import { Readable } from "stream";
import {decamelize} from "xcase";
import { Assets } from "../../../__fixtures__";
import { WorkerAction } from "@packages/core-snapshots/src/contracts";
import WorkerThreads from "worker_threads";

export class ReadableStream extends Readable {
    private count = 0;

    constructor(private prefix: string, private table: string) {
        super({objectMode: true});
    }

    public _read() {
        if (this.count !== Assets[this.table].length) {
            this.push(this.appendPrefix(Assets[this.table][this.count]));
            this.count++;
        }
        else {
            this.push(null)
        }
    }

    private appendPrefix(entity: any) {
        let itemToReturn = {};

        let item = entity;

        for(let key of Object.keys(item)) {
            itemToReturn[this.prefix + decamelize(key)] = item[key];
        }

        return itemToReturn;
    }
}

export const waitForMessage = (action: WorkerAction, actionName: string, params: any): Promise<void> => {
    return new Promise<void>((resolve) => {
        WorkerThreads.parentPort!.once("message", (data) => {
            resolve(data)
        })

        action[actionName](params);
    })
}
