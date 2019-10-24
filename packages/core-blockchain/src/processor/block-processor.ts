import { app, Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Utils } from "@arkecosystem/crypto";

import { validateGenerator } from "../utils/validate-generator";
import {
    AcceptBlockHandler,
    AlreadyForgedHandler,
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
}

@Container.injectable()
export class BlockProcessor {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Log.Logger;

    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.DatabaseService)
    protected readonly database!: Contracts.Database.DatabaseService;

    @Container.inject(Container.Identifiers.TransactionPoolService)
    protected readonly transactionPool!: Contracts.TransactionPool.Connection;

    public async process(block: Interfaces.IBlock): Promise<BlockProcessorResult> {
        if (Utils.isException(block.data.id)) {
            return this.app.resolve<ExceptionHandler>(ExceptionHandler).execute(block);
        }

        if (!(await this.verifyBlock(block))) {
            return this.app.resolve<VerificationFailedHandler>(VerificationFailedHandler).execute(block);
        }

        if (this.blockContainsIncompatibleTransactions(block)) {
            return this.app.resolve<IncompatibleTransactionsHandler>(IncompatibleTransactionsHandler).execute();
        }

        if (this.blockContainsOutOfOrderNonce(block)) {
            return this.app.resolve<NonceOutOfOrderHandler>(NonceOutOfOrderHandler).execute();
        }

        const isValidGenerator: boolean = await validateGenerator(block);
        const isChained: boolean = AppUtils.isBlockChained(this.blockchain.getLastBlock().data, block.data);
        if (!isChained) {
            return this.app
                .resolve<UnchainedHandler>(UnchainedHandler)
                .init(isValidGenerator)
                .execute(block);
        }

        if (!isValidGenerator) {
            return this.app.resolve<InvalidGeneratorHandler>(InvalidGeneratorHandler).execute(block);
        }

        const containsForgedTransactions: boolean = await this.checkBlockContainsForgedTransactions(block);
        if (containsForgedTransactions) {
            return this.app.resolve<AlreadyForgedHandler>(AlreadyForgedHandler).execute(block);
        }

        return this.app.resolve<AcceptBlockHandler>(AcceptBlockHandler).execute(block);
    }

    private async verifyBlock(block: Interfaces.IBlock): Promise<boolean> {
        if (block.verification.containsMultiSignatures) {
            try {
                for (const transaction of block.transactions) {
                    const handler: Handlers.TransactionHandler = await app
                        .get<any>("transactionHandlerRegistry")
                        .get(transaction.type, transaction.typeGroup);
                    await handler.verify(
                        transaction,
                        app.get<any>(Container.Identifiers.DatabaseService).walletRepository,
                    );
                }

                block.verification = block.verify();
            } catch (error) {
                this.logger.warning(`Failed to verify block, because: ${error.message}`);
                block.verification.verified = false;
            }
        }

        const { verified } = block.verification;
        if (!verified) {
            this.logger.warning(
                `Block ${block.data.height.toLocaleString()} (${
                    block.data.id
                }) disregarded because verification failed`,
            );

            this.logger.warning(JSON.stringify(block.verification, undefined, 4));

            return false;
        }

        return true;
    }

    private async checkBlockContainsForgedTransactions(block: Interfaces.IBlock): Promise<boolean> {
        if (block.transactions.length > 0) {
            const forgedIds: string[] = await this.database.getForgedTransactionsIds(
                block.transactions.map(tx => AppUtils.assert.defined(tx.id)),
            );

            if (forgedIds.length > 0) {
                if (this.transactionPool) {
                    this.transactionPool.removeTransactionsById(forgedIds);
                }

                this.logger.warning(
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

            if (data.version && data.version < 2) {
                break;
            }

            const sender: string = AppUtils.assert.defined(data.senderPublicKey);

            if (nonceBySender[sender] === undefined) {
                nonceBySender[sender] = app
                    .get<any>(Container.Identifiers.DatabaseService)
                    .walletRepository.getNonce(sender);
            }

            const nonce: AppUtils.BigNumber = AppUtils.assert.defined(data.nonce);

            if (!nonceBySender[sender].plus(1).isEqualTo(nonce)) {
                this.logger.warning(
                    `Block { height: ${block.data.height.toLocaleString()}, id: ${block.data.id} } ` +
                        `not accepted: invalid nonce order for sender ${sender}: ` +
                        `preceding nonce: ${nonceBySender[sender].toFixed()}, ` +
                        `transaction ${data.id} has nonce ${nonce.toFixed()}.`,
                );
                return true;
            }

            nonceBySender[sender] = nonce;
        }

        return false;
    }
}
