import { Container } from "@arkecosystem/core-kernel";

import { AbstractWorkerAction } from "./abstract-worker-action";
import { ReadProcessor } from "./read-processor";

@Container.injectable()
export class RestoreWorkerAction extends AbstractWorkerAction {
    private readProcessor: ReadProcessor | undefined = undefined;
    private entities = [] as any[];

    public sync(data: any): void {
        this.readProcessor?.sync(data);
    }

    public async start() {
        let isBlock = this.table === "blocks";
        let readStream = this.getReadStream();
        // let verify = this.getVerifyFunction();

        const chunkSize = 1000;

        this.readProcessor = new ReadProcessor(
            isBlock,
            readStream,
            async (entity: any) => {

                if (isBlock) {
                    this.applyGenesisBlockFix(entity);
                }

                this.entities.push(entity);

                if (this.entities.length === chunkSize) {
                    await this.saveValues();
                }

                // TODO: Add verify
                // verify(entity, previousEntity);
            },
            async () => {
                await this.saveValues();
            }
        );

        await this.readProcessor.start();
    }

    private async saveValues<T>() {
        await this.getRepository().save(this.entities);
        this.entities = [];
    }
}
