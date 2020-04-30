import { parentPort } from "worker_threads";
import { Container } from "@arkecosystem/core-kernel";
import { AbstractWorkerAction } from "./abstract-worker-action";

@Container.injectable()
export class DumpWorkerAction extends AbstractWorkerAction {
    public async start() {
        const databaseStream = await this.getRepository().getReadStream(this.options!.start, this.options!.end);
        let streamWriter = this.getStreamWriter(databaseStream);

        await streamWriter.open();

        let interval = setInterval(() => {
            parentPort?.postMessage({
                action: "count",
                data: streamWriter.count,
            });
        }, 100);

        await streamWriter.write();

        clearInterval(interval);
    }
}
