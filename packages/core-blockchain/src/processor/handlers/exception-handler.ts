import { Interfaces } from "@arkecosystem/crypto";
import { BlockProcessorResult } from "../block-processor";
import { AcceptBlockHandler } from "./accept-block-handler";
import { BlockHandler } from "./block-handler";

export class ExceptionHandler extends BlockHandler {
    public async execute(): Promise<BlockProcessorResult> {
        // Ensure the block has not been forged yet, as an exceptional
        // block bypasses all other checks.
        const forgedBlock: Interfaces.IBlock = await this.blockchain.database.getBlock(this.block.data.id);

        if (forgedBlock) {
            return super.execute();
        }

        this.logger.warn(`Block ${this.block.data.height.toLocaleString()} (${this.block.data.id}) forcibly accepted.`);

        return new AcceptBlockHandler(this.blockchain, this.block).execute();
    }
}
