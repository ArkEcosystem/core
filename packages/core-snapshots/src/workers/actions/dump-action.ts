import { parentPort } from "worker_threads";
import { Container } from "@arkecosystem/core-kernel";
import { AbstractWorkerAction } from "./abstract-action";

@Container.injectable()
export class DumpWorkerAction extends AbstractWorkerAction {
    public async start() {
        return new Promise<void>(async (resolve, reject) => {
            let databaseStream = await this.getRepository()
                .createQueryBuilder()
                .orderBy(this.orderBy(), "ASC")
                .stream();

            let writeStream = this.getWriteStream(databaseStream);

            writeStream
                .on('close', () => {
                    resolve();
                });

            let count = 0;
            databaseStream.on("data", () => {
                if (count++ % this.updateStep! === 0) {
                    parentPort?.postMessage(count)
                }
            });
        });
    }

    private orderBy(): string {
        switch (this.table) {
            case "blocks":
                return "height";
            case "transactions":
                return "timestamp";
            case "rounds":
                return "round";
            default:
                throw new Error();
        }
    }
}
