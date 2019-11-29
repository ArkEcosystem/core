// tslint:disable:max-classes-per-file

import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { isBlockChained } from "@arkecosystem/core-utils";
import { Interfaces, Utils } from "@arkecosystem/crypto";
import { Blockchain } from "../blockchain";
import { validateGenerator } from "../utils/validate-generator";
import {
    AcceptBlockHandler,
    AlreadyForgedHandler,
    BlockHandler,
    ExceptionHandler,
    IncompatibleTransactionsHandler,
    InvalidGeneratorHandler,
    NonceOutOfOrderHandler,
    UnchainedHandler,
    VerificationFailedHandler,
} from "./handlers";

export enum BlockProcessorResult {
    Accepted,
    DiscardedButCanBeBroadcasted,
    Rejected,
    Rollback,
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

        if (!(await this.verifyBlock(block))) {
            return new VerificationFailedHandler(this.blockchain, block);
        }

        if (this.blockContainsIncompatibleTransactions(block)) {
            return new IncompatibleTransactionsHandler(this.blockchain, block);
        }

        if (this.blockContainsOutOfOrderNonce(block)) {
            return new NonceOutOfOrderHandler(this.blockchain, block);
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

    private async verifyBlock(block: Interfaces.IBlock): Promise<boolean> {
        if (block.verification.containsMultiSignatures) {
            try {
                for (const transaction of block.transactions) {
                    const handler: Handlers.TransactionHandler = await Handlers.Registry.get(
                        transaction.type,
                        transaction.typeGroup,
                    );
                    await handler.verify(transaction, this.blockchain.database.walletManager);
                }

                block.verification = block.verify();
            } catch (error) {
                this.logger.warn(`Failed to verify block, because: ${error.message}`);
                block.verification.verified = false;
            }
        }

        const { verified } = block.verification;
        if (!verified) {
            this.logger.warn(
                `Block ${block.data.height.toLocaleString()} (${
                    block.data.id
                }) disregarded because verification failed`,
            );

            this.logger.warn(JSON.stringify(block.verification, undefined, 4));

            return false;
        }

        return true;
    }

    private async checkBlockContainsForgedTransactions(block: Interfaces.IBlock): Promise<boolean> {
        if (block.transactions.length > 0) {
            const forgedIds: string[] = await this.blockchain.database.getForgedTransactionsIds(
                block.transactions.map(tx => tx.id),
            );

            if (forgedIds.length > 0) {
                const { transactionPool } = this.blockchain;
                if (transactionPool) {
                    transactionPool.removeTransactionsById(forgedIds);
                }

                this.logger.warn(
                    `Block ${block.data.height.toLocaleString()} disregarded, because it contains already forged transactions`,
                );

                this.logger.debug(`${JSON.stringify(forgedIds, undefined, 4)}`);

                return true;
            }
        }

        return false;
    }

    /**
     * Check if a block contains incompatible transactions and should thus be rejected.
     */
    private blockContainsIncompatibleTransactions(block: Interfaces.IBlock): boolean {
        for (let i = 1; i < block.transactions.length; i++) {
            if (block.transactions[i].data.version !== block.transactions[0].data.version) {
                return true;
            }
        }

        return false;
    }

    /**
     * For a given sender, v2 transactions must have strictly increasing nonce without gaps.
     */
    private blockContainsOutOfOrderNonce(block: Interfaces.IBlock): boolean {
        const nonceBySender = {};

        for (const transaction of block.transactions) {
            const data = transaction.data;

            if (data.version < 2) {
                break;
            }

            const sender: string = data.senderPublicKey;

            if (nonceBySender[sender] === undefined) {
                nonceBySender[sender] = this.blockchain.database.walletManager.getNonce(sender);
            }

            if (!nonceBySender[sender].plus(1).isEqualTo(data.nonce)) {
                this.logger.warn(
                    `Block { height: ${block.data.height.toLocaleString()}, id: ${block.data.id} } ` +
                        `not accepted: invalid nonce order for sender ${sender}: ` +
                        `preceding nonce: ${nonceBySender[sender].toFixed()}, ` +
                        `transaction ${data.id} has nonce ${data.nonce.toFixed()}.`,
                );
                return true;
            }

            nonceBySender[sender] = data.nonce;
        }

        return false;
    }
}
