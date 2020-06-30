import { Container } from "@arkecosystem/core-kernel";

import { AbstractWorkerAction } from "./abstract-worker-action";
import { ReadProcessor } from "./read-processor";

@Container.injectable()
export class VerifyWorkerAction extends AbstractWorkerAction {
    private readProcessor: ReadProcessor | undefined = undefined;

    public sync(data: any): void {
        this.readProcessor!.sync(data);
    }

    public async start() {
        const isBlock = this.table === "blocks";
        const streamReader = this.getStreamReader();
        const verify = this.getVerifyFunction();

        this.readProcessor = new ReadProcessor(isBlock, streamReader, async (entity: any, previousEntity: any) => {
            if (isBlock) {
                this.applyGenesisBlockFix(entity);
            }

            verify(entity, previousEntity);
        });

        await this.readProcessor.start();
    }
}
