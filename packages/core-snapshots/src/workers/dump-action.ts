import { AbstractWorkerAction } from "./abstract-action";
import { Container } from "@arkecosystem/core-kernel";

@Container.injectable()
export class DumpWorkerAction extends AbstractWorkerAction {

    public async start() {
        console.log("DumpWorkerAction START");

        return new Promise<void>(async (resolve, reject) => {
            // let progressDispatcher = this.app.get<ProgressDispatcher>(Identifiers.ProgressDispatcher);
            //
            // await progressDispatcher.start(table, count);

            let databaseStream = await this.getRepository()
                .createQueryBuilder()
                .orderBy(this.orderBy(), "ASC")
                .stream();

            let writeStream = this.getWriteStream(databaseStream);

            writeStream
                .on('close', () => {
                    // progressDispatcher.end();
                    resolve();
                });

            // const errorHandler = (err: Error) => {
            //     reject(err);
            // };

            // snapshotWriteStream.on("error", errorHandler);
            // encodeStream.on("error", errorHandler);
            // databaseStream.on("error", errorHandler);

            // databaseStream.on("data", () => { progressDispatcher.update() });
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
