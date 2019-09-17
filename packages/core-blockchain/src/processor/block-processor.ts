import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Utils } from "@arkecosystem/crypto";

import { validateGenerator } from "../utils/validate-generator";
import {
    AcceptBlockHandler,
    AlreadyForgedHandler,
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

@Container.injectable()
export class BlockProcessor {
    @Container.inject(Container.Identifiers.Application)
    private readonly app: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger: Contracts.Kernel.Log.Logger;

    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchain: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.DatabaseService)
    protected readonly database: Contracts.Database.DatabaseService;

    @Container.inject(Container.Identifiers.TransactionPoolService)
    protected readonly transactionPool: Contracts.TransactionPool.Connection;

    public async process(block: Interfaces.IBlock): Promise<BlockProcessorResult> {
        if (Utils.isException(block.data)) {
            return this.app.resolve<ExceptionHandler>(ExceptionHandler).execute(block);
        }

        if (!(await this.verifyBlock(block))) {
            return this.app.resolve<VerificationFailedHandler>(VerificationFailedHandler).execute(block);
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
            for (const transaction of block.transactions) {
                const handler: Handlers.TransactionHandler = this.app
                    .get<any>("transactionHandlerRegistry")
                    .get(transaction.type, transaction.typeGroup);

                await handler.verify(transaction, this.database.walletRepository);
            }

            block.verification = block.verify();
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
                block.transactions.map(tx => tx.id),
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
}
