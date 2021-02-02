import { Container, Providers } from "@arkecosystem/core-kernel";
import dayjs from "dayjs";
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

    public resolve(logFileName: string): void {
        if (this.counter++ === 0) {
            this.resolveMethod(logFileName);
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
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-manager")
    private readonly configuration!: Providers.PluginConfiguration;

    private runningWorkers: number = 0;

    public canRun(): Boolean {
        return this.runningWorkers === 0;
    }

    public generateLog(databaseFilePath: string, schema: Schema, query: any): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.runningWorkers++;

            let workerData: GenerateLogOptions;

            if (this.configuration.getRequired("archiveFormat") === "zip") {
                workerData = {
                    archiveFormat: "zip",
                    databaseFilePath,
                    schema,
                    query,
                    logFileName: dayjs().format("YYYY-MM-DD_HH-mm-ss") + ".zip",
                };
            } else {
                workerData = {
                    archiveFormat: "gz",
                    databaseFilePath,
                    schema,
                    query,
                    logFileName: dayjs().format("YYYY-MM-DD_HH-mm-ss") + ".log.gz",
                };
            }

            const worker = new Worker(__dirname + "/worker.js", { workerData });

            const resolver = new ResolveRejectOnce(resolve, reject, () => {
                this.runningWorkers--;
            });

            worker
                .on("exit", () => {
                    resolver.resolve(workerData.logFileName);
                })
                .on("error", async (err) => {
                    resolver.reject(err);
                });
        });
    }
}
