import { Container } from "@arkecosystem/core-kernel";

import { AbstractWorkerAction } from "./abstract-worker-action";
import { ReadProcessor } from "./read-processor";

@Container.injectable()
export class RestoreWorkerAction extends AbstractWorkerAction {
    private readProcessor: ReadProcessor | undefined = undefined;
    private entities = [] as any[];

    public sync(data: any): void {
        this.readProcessor!.sync(data);
    }

    public async start() {
        const isBlock = this.table === "blocks";
        const streamReader = this.getStreamReader();
        const verify = this.getVerifyFunction();

        this.readProcessor = new ReadProcessor(
            isBlock,
            streamReader,
            async (entity: any, previousEntity: any) => {
                if (isBlock) {
                    this.applyGenesisBlockFix(entity);
                }

                if (this.options!.verify) {
                    verify(entity, previousEntity);
                }

                this.entities.push(entity);

                if (this.entities.length === this.options!.updateStep) {
                    await this.saveValues();
                }
            },
            async () => {
                await this.saveValues();
            },
        );

        await this.readProcessor.start();
    }

    private async saveValues<T>() {
        await this.getRepository().save(this.entities);
        this.entities = [];
    }
}
