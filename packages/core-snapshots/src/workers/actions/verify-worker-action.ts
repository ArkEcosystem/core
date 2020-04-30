import { AbstractWorkerAction } from "./abstract-worker-action";
import { Container } from "@arkecosystem/core-kernel";
import { ReadProcessor } from "./read-processor";

@Container.injectable()
export class VerifyWorkerAction extends AbstractWorkerAction {
    private readProcessor: ReadProcessor | undefined = undefined;

    public sync(data: any): void {
        this.readProcessor?.sync(data);
    }

    public async start() {
        let isBlock = this.table === "blocks";
        let streamReader = this.getStreamReader();
        let verify = this.getVerifyFunction();

        this.readProcessor = new ReadProcessor(
            isBlock,
            streamReader,
            async (entity: any, previousEntity: any) => {
                if (isBlock) {
                    this.applyGenesisBlockFix(entity);
                }

                verify(entity, previousEntity);
            }
        );

        await this.readProcessor.start();
    }
}
