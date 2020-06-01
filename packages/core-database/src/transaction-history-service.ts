import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { BlockRepository } from "./repositories/block-repository";
import { TransactionRepository } from "./repositories/transaction-repository";

@Container.injectable()
export class TransactionHistoryService implements Contracts.Shared.TransactionHistoryService {
    @Container.inject(Container.Identifiers.DatabaseBlockRepository)
    private readonly blockRepository!: BlockRepository;

    @Container.inject(Container.Identifiers.DatabaseTransactionRepository)
    private readonly transactionRepository!: TransactionRepository;

    @Container.inject(Container.Identifiers.DatabaseTransactionFilter)
    private readonly transactionFilter!: Contracts.Database.TransactionFilter;

    @Container.inject(Container.Identifiers.DatabaseBlockFilter)
    private readonly blockFilter!: Contracts.Database.BlockFilter;

    @Container.inject(Container.Identifiers.DatabaseModelConverter)
    private readonly modelConverter!: Contracts.Database.ModelConverter;

    public async findOneByCriteria(
        criteria: Contracts.Shared.OrTransactionCriteria,
    ): Promise<Interfaces.ITransactionData | undefined> {
        const data = await this.findManyByCriteria(criteria);
        return data[0];
    }

    public async findManyByCriteria(
        criteria: Contracts.Shared.OrTransactionCriteria,
    ): Promise<Interfaces.ITransactionData[]> {
        const expression = await this.transactionFilter.getExpression(criteria);
        const models = await this.transactionRepository.findManyByExpression(expression);
        const data = this.modelConverter.getTransactionData(models);
        return data;
    }

    public async listByCriteria(
        criteria: Contracts.Shared.OrTransactionCriteria,
        order: Contracts.Search.ListOrder,
        page: Contracts.Search.ListPage,
        options?: Contracts.Search.ListOptions,
    ): Promise<Contracts.Search.ListResult<Interfaces.ITransactionData>> {
        const expression = await this.transactionFilter.getExpression(criteria);
        const modelListResult = await this.transactionRepository.listByExpression(expression, order, page, options);
        const models = modelListResult.rows;
        const data = this.modelConverter.getTransactionData(models);
        return { ...modelListResult, rows: data };
    }

    public async findOneByCriteriaJoinBlock(
        criteria: Contracts.Shared.OrTransactionCriteria,
    ): Promise<Contracts.Shared.TransactionDataWithBlockData | undefined> {
        const data = await this.findManyByCriteriaJoinBlock(criteria);
        return data[0];
    }

    public async findManyByCriteriaJoinBlock(
        transactionCriteria: Contracts.Shared.OrTransactionCriteria,
    ): Promise<Contracts.Shared.TransactionDataWithBlockData[]> {
        const transactionExpression = await this.transactionFilter.getExpression(transactionCriteria);
        const transactionModels = await this.transactionRepository.findManyByExpression(transactionExpression);

        const blockCriteria = { id: transactionModels.map((t) => t.blockId) };
        const blockExpression = await this.blockFilter.getExpression(blockCriteria);
        const blockModels = await this.blockRepository.findManyByExpression(blockExpression);

        return this.modelConverter.getTransactionDataWithBlockData(transactionModels, blockModels);
    }

    public async listByCriteriaJoinBlock(
        transactionCriteria: Contracts.Shared.OrTransactionCriteria,
        order: Contracts.Search.ListOrder,
        page: Contracts.Search.ListPage,
        options?: Contracts.Search.ListOptions,
    ): Promise<Contracts.Search.ListResult<Contracts.Shared.TransactionDataWithBlockData>> {
        const transactionExpression = await this.transactionFilter.getExpression(transactionCriteria);
        const transactionListResult = await this.transactionRepository.listByExpression(
            transactionExpression,
            order,
            page,
            options,
        );
        const transactionModels = transactionListResult.rows;

        const blockCriteria = { id: transactionModels.map((t) => t.blockId) };
        const blockExpression = await this.blockFilter.getExpression(blockCriteria);
        const blockModels = await this.blockRepository.findManyByExpression(blockExpression);

        const transactionDataWithBlockData = this.modelConverter.getTransactionDataWithBlockData(
            transactionModels,
            blockModels,
        );

        return { ...transactionListResult, rows: transactionDataWithBlockData };
    }
}
