import { AbstractWorkerAction } from "./abstract-action";
import { Container } from "@arkecosystem/core-kernel";
import { Models } from "@packages/core-database";

@Container.injectable()
export class RestoreWorkerAction extends AbstractWorkerAction {

    public async start() {
        let readStream = this.getReadStream();

        // let progressDispatcher = this.app.get<ProgressDispatcher>(Identifiers.ProgressDispatcher);
        // await progressDispatcher.start(table, count);

        let entities: any[] = [];
        const chunkSize = 1000;

        for await (const entity of readStream) {
            if (this.table === "blocks") {
                this.applyGenesisBlockFix(entity as unknown as Models.Block);
            }

            entities.push(entity);

            if (entities.length === chunkSize) {
                await this.saveValues(entities);
                entities = [];
            }

            // await progressDispatcher.update();
        }

        if (entities.length) {
            await this.saveValues(entities);
        }

        // await progressDispatcher.end();
    }

    private async saveValues<T>(entities: any[]) {
        await this.getRepository().save(entities);
    }
}
