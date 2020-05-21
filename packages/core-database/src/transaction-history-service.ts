import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { TransactionRepository } from "./repositories/transaction-repository";

@Container.injectable()
export class TransactionHistoryService implements Contracts.Shared.TransactionHistoryService {
    @Container.inject(Container.Identifiers.DatabaseTransactionRepository)
    private readonly transactionRepository!: TransactionRepository;

    @Container.inject(Container.Identifiers.DatabaseTransactionFilter)
    private readonly transactionFilter!: Contracts.Database.TransactionFilter;

    @Container.inject(Container.Identifiers.DatabaseTransactionModelConverter)
    private readonly transactionModelConverter!: Contracts.Database.TransactionModelConverter;

    public async findOneByCriteria(
        criteria: Contracts.Shared.OrTransactionCriteria,
    ): Promise<Interfaces.ITransactionData | undefined> {
        const expression = await this.transactionFilter.getExpression(criteria);
        const model = await this.transactionRepository.findOneByExpression(expression);
        const data = model ? this.transactionModelConverter.getTransactionData(model) : undefined;
        return data;
    }

    public async findManyByCriteria(
        criteria: Contracts.Shared.OrTransactionCriteria,
    ): Promise<Interfaces.ITransactionData[]> {
        const expression = await this.transactionFilter.getExpression(criteria);
        const models = await this.transactionRepository.findManyByExpression(expression);
        const data = models.map((m) => this.transactionModelConverter.getTransactionData(m));
        return data;
    }

    public async listByCriteria(
        criteria: Contracts.Shared.OrTransactionCriteria,
        order: Contracts.Search.ListOrder,
        page: Contracts.Search.ListPage,
        options?: Contracts.Search.ListOptions,
    ): Promise<Contracts.Search.ListResult<Interfaces.ITransactionData>> {
        const expression = await this.transactionFilter.getExpression(criteria);
        const listResult = await this.transactionRepository.listByExpression(expression, order, page, options);
        const rows = listResult.rows.map((m) => this.transactionModelConverter.getTransactionData(m));
        return { ...listResult, rows };
    }
}
