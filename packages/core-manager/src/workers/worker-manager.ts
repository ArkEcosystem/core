import { Container } from "@arkecosystem/core-kernel";
import { Worker } from "worker_threads";

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
    public generateLog(filePath: string, query: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const resolver = new ResolveRejectOnce(resolve, reject);

            const workerData = {
                filePath,
                query,
            };

            const worker = new Worker(__dirname + "/worker.js", { workerData });

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
