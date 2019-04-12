// tslint:disable:max-classes-per-file

import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { isBlockChained } from "@arkecosystem/core-utils";
import { Blocks, Utils } from "@arkecosystem/crypto";
import { Blockchain } from "../blockchain";
import { validateGenerator } from "../utils/validate-generator";

import {
    AcceptBlockHandler,
    AlreadyForgedHandler,
    BlockHandler,
    ExceptionHandler,
    InvalidGeneratorHandler,
    UnchainedHandler,
    VerificationFailedHandler,
} from "./handlers";

export enum BlockProcessorResult {
    Accepted,
    DiscardedButCanBeBroadcasted,
    Rejected,
}

export class BlockProcessor {
    private logger: Logger.ILogger;

    public constructor(private blockchain: Blockchain) {
        this.logger = app.resolvePlugin<Logger.ILogger>("logger");
    }

    public async process(block: Blocks.Block): Promise<BlockProcessorResult> {
        const handler = await this.getHandler(block);
        return handler.execute();
    }

    public async getHandler(block: Blocks.Block): Promise<BlockHandler> {
        if (Utils.isException(block.data)) {
            return new ExceptionHandler(this.blockchain, block);
        }

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
    private verifyBlock(block: Blocks.Block): boolean {
        const verified = block.verification.verified;
        if (!verified) {
            this.logger.warn(
                `Block ${block.data.height.toLocaleString()} (${
                    block.data.id
                }) disregarded because verification failed`,
            );
            this.logger.warn(JSON.stringify(block.verification, null, 4));
            return false;
        }

        return true;
    }

    /**
     * Checks if the given block contains an already forged transaction.
     */
    private async checkBlockContainsForgedTransactions(block: Blocks.Block): Promise<boolean> {
        if (block.transactions.length > 0) {
            const forgedIds = await this.blockchain.database.getForgedTransactionsIds(
                block.transactions.map(tx => tx.id),
            );
            if (forgedIds.length > 0) {
                this.logger.warn(
                    `Block ${block.data.height.toLocaleString()} disregarded, because it contains already forged transactions`,
                );
                this.logger.debug(`${JSON.stringify(forgedIds, null, 4)}`);
                return true;
            }
        }

        return false;
    }
}
