import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Enums, Interfaces, Utils } from "@arkecosystem/crypto";

import { Identifiers } from "../identifiers";
import { BlockCriteria, SomeBlockResource, SomeBlockResourcesPage, TransformedBlockResource } from "./block-resource";
import { DbBlockService } from "./db-block-service";
import { DbTransactionService } from "./db-transaction-service";

export class DbBlockResourceService {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    @Container.inject(Identifiers.DbBlockService)
    private readonly dbBlockService!: DbBlockService;

    @Container.inject(Identifiers.DbTransactionService)
    private readonly dbTransactionService!: DbTransactionService;

    public async getBlock(
        transform: boolean,
        blockIdOrHeight: string,
        ...criterias: BlockCriteria[]
    ): Promise<SomeBlockResource | undefined> {
        const dbBlockCriteria = [{ id: blockIdOrHeight }, { height: parseFloat(blockIdOrHeight) }];
        const dbBlock = await this.dbBlockService.getBlock(dbBlockCriteria, ...criterias);

        if (!dbBlock) {
            return undefined;
        }

        if (transform) {
            const dbBlockTransactions = await this.dbTransactionService.getTransactions("sequence:asc", {
                blockId: dbBlock.id,
            });

            return this.getTransformedBlockResource(dbBlock, dbBlockTransactions);
        } else {
            return this.getRawBlockResource(dbBlock);
        }
    }

    public async getBlocksPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        transform: boolean,
        ...criterias: BlockCriteria[]
    ): Promise<SomeBlockResourcesPage> {
        if (ordering.length === 0) {
            ordering = "blockHeight:desc";
        }

        const dbBlocksPage = await this.dbBlockService.getBlocksPage(pagination, ordering, ...criterias);

        if (transform) {
            const dbBlockTransactions = await this.dbTransactionService.getTransactions("sequence:asc", {
                blockId: dbBlocksPage.results.map((block) => block.id),
            });

            const transformedBlocks = dbBlocksPage.results.map((block) => {
                return this.getTransformedBlockResource(
                    block,
                    dbBlockTransactions.filter((transaction) => transaction.blockId === block.id),
                );
            });

            return { ...dbBlocksPage, results: transformedBlocks };
        } else {
            return { ...dbBlocksPage, results: dbBlocksPage.results.map((b) => this.getRawBlockResource(b)) };
        }
    }

    private getTransformedBlockResource(
        dbBlock: Contracts.Database.BlockModel,
        dbBlockTransactions: Contracts.Database.TransactionModel[],
    ): TransformedBlockResource {
        const totalMultiPaymentTransferred = dbBlockTransactions
            .filter((t) => t.typeGroup === Enums.TransactionTypeGroup.Core)
            .filter((t) => t.type === Enums.TransactionType.MultiPayment)
            .flatMap((t) => t.asset.payments)
            .reduce((sum, payment) => sum.plus(payment.amount), Utils.BigNumber.ZERO);
        const totalAmountTransferred = dbBlock.totalAmount.plus(totalMultiPaymentTransferred);

        const generator = this.walletRepository.findByPublicKey(dbBlock.generatorPublicKey);
        const generatorUsername = generator.hasAttribute("delegate.username")
            ? generator.getAttribute("delegate.username")
            : undefined;

        const confirmations = this.stateStore.getLastHeight() - dbBlock.height;

        return {
            id: dbBlock.id,
            version: dbBlock.version,
            height: dbBlock.height,
            previous: dbBlock.previousBlock,
            forged: {
                reward: dbBlock.reward,
                fee: dbBlock.totalFee,
                amount: totalAmountTransferred,
                total: dbBlock.reward.plus(dbBlock.totalFee),
            },
            payload: {
                hash: dbBlock.payloadHash,
                length: dbBlock.payloadLength,
            },
            generator: {
                username: generatorUsername,
                address: generator.address,
                publicKey: dbBlock.generatorPublicKey,
            },
            signature: dbBlock.blockSignature,
            confirmations,
            transactions: dbBlock.numberOfTransactions,
            timestamp: AppUtils.formatTimestamp(dbBlock.timestamp),
        };
    }

    private getRawBlockResource(dbBlock: Contracts.Database.BlockModel): Interfaces.IBlockData {
        return dbBlock;
    }
}
