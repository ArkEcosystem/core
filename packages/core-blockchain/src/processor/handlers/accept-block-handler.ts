import { BlockProcessorResult } from "../block-processor";
import { BlockHandler } from "./block-handler";

export class AcceptBlockHandler extends BlockHandler {
    public async execute(): Promise<BlockProcessorResult> {
        const { database, state, transactionPool } = this.blockchain;

        try {
            await database.applyBlock(this.block);
            await database.saveBlock(this.block);

            // Check if we recovered from a fork
            if (state.forkedBlock && state.forkedBlock.data.height === this.block.data.height) {
                this.logger.info("Successfully recovered from fork");
                state.forkedBlock = null;
            }

            if (transactionPool) {
                try {
                    transactionPool.acceptChainedBlock(this.block);
                } catch (error) {
                    this.logger.warn("Issue applying block to transaction pool");
                    this.logger.debug(error.stack);
                }
            }

            // Reset wake-up timer after chaining a block, since there's no need to
            // wake up at all if blocks arrive periodically. Only wake up when there are
            // no new blocks.
            if (state.started) {
                this.blockchain.resetWakeUp();
            }

            state.setLastBlock(this.block);

            // Ensure the lastDownloadedBlock is never behind the last accepted block.
            if (state.lastDownloadedBlock && state.lastDownloadedBlock.data.height < this.block.data.height) {
                state.lastDownloadedBlock = this.block;
            }

            return BlockProcessorResult.Accepted;
        } catch (error) {
            this.logger.error(`Refused new block ${JSON.stringify(this.block.data)}`);
            this.logger.debug(error.stack);

            this.blockchain.transactionPool.purgeBlock(this.block);
            this.blockchain.forkBlock(this.block);

            return super.execute();
        }
    }
}
