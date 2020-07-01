import { EventEmitter } from "events";
import { Worker } from "worker_threads";

export class WorkerWrapper extends EventEmitter {
    private worker: Worker;
    private isDone: boolean = false;

    public constructor(data: any) {
        super();
        this.worker = new Worker(__dirname + "/worker.js", { workerData: data });

        this.worker.on("message", (data) => {
            this.handleMessage(data);
        });

        this.worker.on("error", (err) => {
            this.emit("*", { name: "error", data: err });
        });

        this.worker.on("exit", (statusCode) => {
            this.isDone = true;
            this.emit("exit", statusCode);
            this.emit("*", { name: "exit", data: statusCode });
        });
    }

    public start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.once("*", (data) => {
                if (data.name === "started") {
                    resolve();
                } else if (data.name === "exit") {
                    resolve();
                } else if (data.name === "exception" || data.name === "error") {
                    reject(data.data);
                } else {
                    reject();
                }
            });

            this.worker.postMessage({ action: "start" });
        });
    }

    public sync(data: any): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.isDone) {
                resolve();
                return;
            }

            this.once("*", (data) => {
                if (data.name === "synchronized") {
                    resolve(data.data);
                } else if (data.name === "exit") {
                    resolve();
                } else if (data.name === "exception" || data.name === "error") {
                    reject(data.data);
                } else {
                    reject();
                }
            });

            this.worker.postMessage({
                action: "sync",
                data: data,
            });
        });
    }

    public async terminate() {
        await this.worker.terminate();
    }

    private handleMessage(data) {
        // Actions: count, started, synced, exit, error
        this.emit(data.action, data.data);
        /* istanbul ignore next */
        if (data.action !== "count" && data.action !== "log") {
            this.emit("*", { name: data.action, data: data.data });
        }
    }
}
