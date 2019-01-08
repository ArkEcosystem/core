// tslint:disable:max-classes-per-file

import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { Blockchain } from "../blockchain";
import { isBlockChained } from "../utils/is-block-chained";
import { validateGenerator } from "../utils/validate-generator";

import {
    AcceptBlockHandler,
    AlreadyForgedHandler,
    BlockHandler,
    InvalidGeneratorHandler,
    UnchainedHandler,
    VerificationFailedHandler,
} from "./handlers";

const logger = app.resolvePlugin<Logger.ILogger>("logger");

export enum BlockProcessorResult {
    Accepted,
    DiscardedButCanBeBroadcasted,
    Rejected,
}

export class BlockProcessor {
    public constructor(private blockchain: Blockchain) {}

    public async process(block: any): Promise<BlockProcessorResult> {
        const handler = await this.getHandler(block);
        return handler.execute();
    }

    private async getHandler(block): Promise<BlockHandler> {
        if (!this.verifyBlock(block)) {
            return new VerificationFailedHandler(this.blockchain, block);
        }

        const isValidGenerator = await validateGenerator(block);
        const isChained = isBlockChained(this.blockchain.getLastBlock(), block);
        if (!isChained) {
            return new UnchainedHandler(this.blockchain, block, isValidGenerator);
        }

        if (!isValidGenerator) {
            return new InvalidGeneratorHandler(this.blockchain, block);
        }

        const containsForgedTransactions = await this.checkBlockContainsForgedTransactions(block);
        if (containsForgedTransactions) {
            return new AlreadyForgedHandler(this.blockchain, block);
        }

        return new AcceptBlockHandler(this.blockchain, block);
    }

    /**
     * Checks if the given block is verified or an exception.
     */
    private verifyBlock(block: any): boolean {
        const verified = block.verification.verified;
        if (!verified) {
            if (this.blockchain.database.__isException(block.data)) {
                logger.warn(
                    `Block ${block.data.height.toLocaleString()} (${
                        block.data.id
                    }) verification failed, but accepting because it is an exception.`,
                );
            } else {
                logger.warn(
                    `Block ${block.data.height.toLocaleString()} (${
                        block.data.id
                    }) disregarded because verification failed :scroll:`,
                );
                logger.warn(JSON.stringify(block.verification, null, 4));
                return false;
            }
        }

        return true;
    }

    /**
     * Checks if the given block contains an already forged transaction.
     */
    private async checkBlockContainsForgedTransactions(block): Promise<boolean> {
        if (block.transactions.length > 0) {
            const forgedIds = await this.blockchain.database.getForgedTransactionsIds(
                block.transactions.map(tx => tx.id),
            );
            if (forgedIds.length > 0) {
                logger.warn(
                    `Block ${block.data.height.toLocaleString()} disregarded, because it contains already forged transactions :scroll:`,
                );
                logger.debug(`${JSON.stringify(forgedIds, null, 4)}`);
                return true;
            }
        }

        return false;
    }
}
