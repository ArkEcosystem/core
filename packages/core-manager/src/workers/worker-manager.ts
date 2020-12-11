import { Container } from "@arkecosystem/core-kernel";
import { Worker } from "worker_threads";

import { Options as GenerateLogOptions } from "./actions/generate-log";

class ResolveRejectOnce {
    private counter: number = 0;

    public constructor(private readonly resolveMethod: Function, private readonly rejectMethod: Function) {}

    public resolve(): void {
        if (this.counter++ === 0) {
            this.resolveMethod();
        }
    }

    public reject(err: Error): void {
        if (this.counter++ === 0) {
            this.rejectMethod(err);
        }
    }
}

@Container.injectable()
export class WorkerManager {
    public generateLog(databaseFilePath: string, logFilePath: string, query: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const workerData: GenerateLogOptions = {
                databaseFilePath,
                logFilePath,
                query,
            };

            const worker = new Worker(__dirname + "/worker.js", { workerData });

            const resolver = new ResolveRejectOnce(resolve, reject);
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
