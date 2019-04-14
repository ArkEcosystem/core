import { BlockProcessorResult } from "../block-processor";
import { BlockHandler } from "./block-handler";

export class VerificationFailedHandler extends BlockHandler {
    public async execute(): Promise<BlockProcessorResult> {
        this.blockchain.transactionPool.purgeSendersWithInvalidTransactions(this.block);

        return super.execute();
    }
}
