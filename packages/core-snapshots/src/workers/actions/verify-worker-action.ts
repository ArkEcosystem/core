import { AbstractWorkerAction } from "./abstract-worker-action";
import { Container } from "@arkecosystem/core-kernel";
import { Verifier } from "../../verifier";
import { ReadProcessor } from "./read-processor";

@Container.injectable()
export class VerifyWorkerAction extends AbstractWorkerAction {
    private readProcessor: ReadProcessor | undefined = undefined;

    public sync(data: any): void {
        this.readProcessor?.sync(data);
    }

    public async start() {
        let isBlock = this.table === "blocks";
        let readStream = this.getReadStream();
        let verify = this.getVerifyFunction();

        this.readProcessor = new ReadProcessor(
            isBlock,
            readStream,
            async (entity: any, previousEntity: any) => {
                if (isBlock) {
                    this.applyGenesisBlockFix(entity);
                }

                verify(entity, previousEntity);
            }
        );

        await this.readProcessor?.start();
    }

    private getVerifyFunction(): Function {
        switch (this.table) {
            case "blocks":
                return Verifier.verifyBlock;
            case "transactions":
                return Verifier.verifyTransaction;
            case "rounds":
                return Verifier.verifyRound;
            default:
                throw new Error();
        }
    }
}
