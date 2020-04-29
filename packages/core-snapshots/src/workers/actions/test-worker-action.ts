import { Container } from "@arkecosystem/core-kernel";
import { WorkerAction } from "@packages/core-snapshots/src/contracts";
import { parentPort } from "worker_threads";

// For testing purposes only
@Container.injectable()
export class TestWorkerAction implements WorkerAction {
    private options: any | undefined;
    private resume: Function | undefined;

    public init(options: any): void {
        this.options = options;
    }

    public sync(data: any): void {
        if (this.resume) {
            this.resume();
        }

        // console.log("SYNC")

        if (data.execute === "throwError") {
            throw new Error("Sync Error");
        }
    }

    public async start() {
        // console.log("START")

        if (this.options.table === "throwError") {
            throw new Error("Start Error");
        } else if (this.options.table === "wait") {
            parentPort!.postMessage({
                action: "started",
            });

            await new Promise((resolve) => { this.resume = () => { resolve() } })
        }
    }
}
