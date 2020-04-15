import { AbstractWorkerAction } from "./abstract-action";
import { Container } from "@arkecosystem/core-kernel";
import { Models } from "@packages/core-database";
import { Verifier } from "../transport/verifier";

@Container.injectable()
export class VerifyWorkerAction extends AbstractWorkerAction {

    public async start() {
        let verifyFunction = this.getVerifyFunction();

        let readStream = this.getReadStream();

        // let progressDispatcher = this.app.get<ProgressDispatcher>(Identifiers.ProgressDispatcher);
        // await progressDispatcher.start(table, count);

        let previousEntity: any = undefined;
        for await (const entity of readStream) {
            // await progressDispatcher.update();

            if (this.table === "blocks") {
                this.applyGenesisBlockFix(entity as unknown as Models.Block);
            }

            const isVerified = verifyFunction(entity, previousEntity);
            if (!isVerified) {
                // TODO: Throw error
                throw new Error();
            }

            previousEntity = entity;
        }

        // await progressDispatcher.end();
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
