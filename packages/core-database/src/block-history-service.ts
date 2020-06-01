import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { BlockRepository } from "./repositories/block-repository";
import { TransactionRepository } from "./repositories/transaction-repository";

@Container.injectable()
export class BlockHistoryService implements Contracts.Shared.BlockHistoryService {
    @Container.inject(Container.Identifiers.DatabaseBlockRepository)
    private readonly blockRepository!: BlockRepository;

    @Container.inject(Container.Identifiers.DatabaseTransactionRepository)
    private readonly transactionRepository!: TransactionRepository;

    @Container.inject(Container.Identifiers.DatabaseBlockFilter)
    private readonly blockFilter!: Contracts.Database.BlockFilter;

    @Container.inject(Container.Identifiers.DatabaseTransactionFilter)
    private readonly transactionFilter!: Contracts.Database.TransactionFilter;

    @Container.inject(Container.Identifiers.DatabaseBlockModelConverter)
    private readonly blockModelConverter!: Contracts.Database.BlockModelConverter;

    public async findOneByCriteria(
        criteria: Contracts.Shared.OrBlockCriteria,
    ): Promise<Interfaces.IBlockData | undefined> {
        const data = await this.findManyByCriteria(criteria);
        return data[0];
    }

    public async findManyByCriteria(criteria: Contracts.Shared.OrBlockCriteria): Promise<Interfaces.IBlockData[]> {
        const expression = await this.blockFilter.getExpression(criteria);
        const models = await this.blockRepository.findManyByExpression(expression);
        const data = this.blockModelConverter.getBlockData(models);
        return data;
    }

    public async listByCriteria(
        criteria: Contracts.Shared.OrBlockCriteria,
        order: Contracts.Search.ListOrder,
        page: Contracts.Search.ListPage,
        options?: Contracts.Search.ListOptions,
    ): Promise<Contracts.Search.ListResult<Interfaces.IBlockData>> {
        const expression = await this.blockFilter.getExpression(criteria);
        const modelListResult = await this.blockRepository.listByExpression(expression, order, page, options);
        const models = modelListResult.rows;
        const data = this.blockModelConverter.getBlockData(models);
        return { ...modelListResult, rows: data };
    }

    public async findOneByCriteriaJoinTransactions(
        blockCriteria: Contracts.Shared.OrBlockCriteria,
        transactionCriteria: Contracts.Shared.OrTransactionCriteria,
    ): Promise<Contracts.Shared.BlockDataWithTransactionData | undefined> {
        const data = await this.findManyByCriteriaJoinTransactions(blockCriteria, transactionCriteria);
        return data[0];
    }

    public async findManyByCriteriaJoinTransactions(
        blockCriteria: Contracts.Shared.OrBlockCriteria,
        transactionCriteria: Contracts.Shared.OrTransactionCriteria,
    ): Promise<Contracts.Shared.BlockDataWithTransactionData[]> {
        const blockExpression = await this.blockFilter.getExpression(blockCriteria);
        const blockModels = await this.blockRepository.findManyByExpression(blockExpression);

        const transactionBlockCriteria = blockModels.map((b) => ({ blockId: b.id }));
        const transactionExpression = await this.transactionFilter.getExpression(
            transactionCriteria,
            transactionBlockCriteria,
        );
        const transactionModels = await this.transactionRepository.findManyByExpression(transactionExpression);
        const blockDataWithTransactionData = this.blockModelConverter.getBlockDataWithTransactionData(
            blockModels,
            transactionModels,
        );

        return blockDataWithTransactionData;
    }

    public async listByCriteriaJoinTransactions(
        blockCriteria: Contracts.Search.OrCriteria<Contracts.Shared.BlockCriteria>,
        transactionCriteria: Contracts.Search.OrCriteria<Contracts.Shared.TransactionCriteria>,
        order: Contracts.Search.ListOrder,
        page: Contracts.Search.ListPage,
        options?: Contracts.Search.ListOptions,
    ): Promise<Contracts.Search.ListResult<Contracts.Shared.BlockDataWithTransactionData>> {
        const blockExpression = await this.blockFilter.getExpression(blockCriteria);
        const blockModelListResult = await this.blockRepository.listByExpression(blockExpression, order, page, options);
        const blockModels = blockModelListResult.rows;

        const transactionBlockCriteria = blockModels.map((b) => ({ blockId: b.id }));
        const transactionExpression = await this.transactionFilter.getExpression(
            transactionCriteria,
            transactionBlockCriteria,
        );
        const transactionModels = await this.transactionRepository.findManyByExpression(transactionExpression);
        const blockDataWithTransactionData = this.blockModelConverter.getBlockDataWithTransactionData(
            blockModels,
            transactionModels,
        );

        return { ...blockModelListResult, rows: blockDataWithTransactionData };
    }
}
