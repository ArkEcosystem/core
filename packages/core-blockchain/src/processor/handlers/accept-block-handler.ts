import { TransactionPool } from "@arkecosystem/core-interfaces";
import { BlockProcessorResult } from "../block-processor";
import { BlockHandler } from "./block-handler";

export class AcceptBlockHandler extends BlockHandler {
    public async execute(): Promise<BlockProcessorResult> {
        const { database, state, transactionPool } = this.blockchain;

        let transactionPoolWasReset: boolean = false;
        try {
            if (transactionPool) {
                try {
                    await transactionPool.acceptChainedBlock(this.block);
                } catch (error) {
                    // reset transaction pool as it could be out of sync with db state
                    await this.resetTransactionPool(transactionPool);
                    transactionPoolWasReset = true;

                    this.logger.warn("Issue applying block to transaction pool");
                    this.logger.debug(error.stack);
                }
            }

            await database.applyBlock(this.block);

            // Check if we recovered from a fork
            if (state.forkedBlock && state.forkedBlock.data.height === this.block.data.height) {
                this.logger.info("Successfully recovered from fork");
                state.forkedBlock = undefined;
            }

            // Reset wake-up timer after chaining a block, since there's no need to
            // wake up at all if blocks arrive periodically. Only wake up when there are
            // no new blocks.
            if (state.started) {
                this.blockchain.resetWakeUp();
            }

            state.setLastBlock(this.block);

            // Ensure the lastDownloadedBlock is never behind the last accepted block.
            if (state.lastDownloadedBlock && state.lastDownloadedBlock.height < this.block.data.height) {
                state.lastDownloadedBlock = this.block.data;
            }

            return BlockProcessorResult.Accepted;
        } catch (error) {
            if (transactionPool && !transactionPoolWasReset) {
                // reset transaction pool as it could be out of sync with db state
                await this.resetTransactionPool(transactionPool);
            }

            this.logger.warn(`Refused new block ${JSON.stringify(this.block.data)}`);
            this.logger.debug(error.stack);

            return super.execute();
        }
    }

    private async resetTransactionPool(transactionPool: TransactionPool.IConnection): Promise<void> {
        // backup transactions from pool, flush it, reset wallet manager, re-add transactions
        const transactions = transactionPool.getAllTransactions();

        transactionPool.flush();
        transactionPool.walletManager.reset();

        await transactionPool.addTransactions(transactions);
    }
}
