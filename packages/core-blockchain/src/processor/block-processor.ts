// tslint:disable:max-classes-per-file

import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions";
import { isBlockChained } from "@arkecosystem/core-utils";
import { Interfaces, Utils } from "@arkecosystem/crypto";
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
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");

    public constructor(private readonly blockchain: Blockchain) {}

    public async process(block: Interfaces.IBlock): Promise<BlockProcessorResult> {
        return (await this.getHandler(block)).execute();
    }

    public async getHandler(block: Interfaces.IBlock): Promise<BlockHandler> {
        if (Utils.isException(block.data)) {
            return new ExceptionHandler(this.blockchain, block);
        }

        if (!this.verifyBlock(block)) {
            return new VerificationFailedHandler(this.blockchain, block);
        }

        const isValidGenerator: boolean = await validateGenerator(block);
        const isChained: boolean = isBlockChained(this.blockchain.getLastBlock().data, block.data);
        if (!isChained) {
            return new UnchainedHandler(this.blockchain, block, isValidGenerator);
        }

        if (!isValidGenerator) {
            return new InvalidGeneratorHandler(this.blockchain, block);
        }

        const containsForgedTransactions: boolean = await this.checkBlockContainsForgedTransactions(block);
        if (containsForgedTransactions) {
            return new AlreadyForgedHandler(this.blockchain, block);
        }

        return new AcceptBlockHandler(this.blockchain, block);
    }

    /**
     * Checks if the given block is verified or an exception
     */
    private verifyBlock(block: Interfaces.IBlock): boolean {
        // TODO: refactor block verification
        if (block.verification.containsMultiSignatures) {
            block.transactions.forEach(transaction => {
                const handler = TransactionHandlerRegistry.get(transaction.type);
                handler.verify(transaction, this.blockchain.database.walletManager);
            });

            block.verification = block.verify();
        }

        const { verified } = block.verification;
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
    private async checkBlockContainsForgedTransactions(block: Interfaces.IBlock): Promise<boolean> {
        if (block.transactions.length > 0) {
            const forgedIds: string[] = await this.blockchain.database.getForgedTransactionsIds(
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
