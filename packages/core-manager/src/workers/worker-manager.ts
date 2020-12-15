import { Container } from "@arkecosystem/core-kernel";
import { Worker } from "worker_threads";

import { Schema } from "../database/database";
import { Options as GenerateLogOptions } from "./actions/generate-log";

class ResolveRejectOnce {
    private counter: number = 0;

    public constructor(
        private readonly resolveMethod: Function,
        private readonly rejectMethod: Function,
        private readonly onFinish: Function,
    ) {}

    public resolve(): void {
        if (this.counter++ === 0) {
            this.resolveMethod();
            this.onFinish();
        }
    }

    public reject(err: Error): void {
        if (this.counter++ === 0) {
            this.rejectMethod(err);
            this.onFinish();
        }
    }
}

@Container.injectable()
export class WorkerManager {
    private runningWorkers: number = 0;

    public canRun(): Boolean {
        return this.runningWorkers === 0;
    }

    public generateLog(databaseFilePath: string, schema: Schema, query: any, logFileName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.runningWorkers++;

            const workerData: GenerateLogOptions = {
                databaseFilePath,
                schema,
                query,
                logFileName,
            };

            const worker = new Worker(__dirname + "/worker.js", { workerData });

            const resolver = new ResolveRejectOnce(resolve, reject, () => {
                this.runningWorkers--;
            });

            worker
                .on("exit", () => {
                    resolver.resolve();
                })
                .on("error", async (err) => {
                    resolver.reject(err);
                });
        });
    }
}
