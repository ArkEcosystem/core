import { parentPort } from "worker_threads";
import { Container } from "@arkecosystem/core-kernel";
import { AbstractWorkerAction } from "./abstract-worker-action";
import { StreamWriter } from "../../filesystem";

@Container.injectable()
export class DumpWorkerAction extends AbstractWorkerAction {
    public async start() {
        const databaseStream = await this.getRepository().getReadStream(this.options!.start, this.options!.end);

        let streamWriter = new StreamWriter(databaseStream, this.filePath!, this.getCodec()[`${this.table}Encode`]);

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
