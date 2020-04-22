import { parentPort } from "worker_threads";
import { Container } from "@arkecosystem/core-kernel";
import { AbstractWorkerAction } from "./abstract-worker-action";

@Container.injectable()
export class DumpWorkerAction extends AbstractWorkerAction {
    public async start() {
        return new Promise<void>(async (resolve, reject) => {
            const databaseStream = await this.getRepository().getReadStream();
            let writeStream = await this.getWriteStream(databaseStream);

            let count = 0;

            let interval = setInterval(() => {
                parentPort?.postMessage({
                    action: "count",
                    data: count,
                });
            }, 100);

            writeStream.on("close", () => {
                clearInterval(interval!);
                resolve();
            });

            databaseStream.on("data", (data) => {
                count++;
            });
        });
    }
}
