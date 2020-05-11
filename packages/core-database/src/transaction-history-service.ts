import { TransactionsManager } from "@arkecosystem/core-crypto";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { Transaction } from "./models/transaction";
import { TransactionRepository } from "./repositories/transaction-repository";

@Container.injectable()
export class TransactionHistoryService implements Contracts.Shared.TransactionHistoryService {
    @Container.inject(Container.Identifiers.TransactionManager)
    private readonly transactionsManager!: TransactionsManager;

    @Container.inject(Container.Identifiers.DatabaseTransactionRepository)
    private readonly transactionRepository!: TransactionRepository;

    @Container.inject(Container.Identifiers.DatabaseTransactionFilter)
    private readonly transactionFilter!: Contracts.Database.TransactionFilter;

    public async findOneByCriteria(
        criteria: Contracts.Shared.OrTransactionCriteria,
    ): Promise<Interfaces.ITransactionData | undefined> {
        const expression = await this.transactionFilter.getWhereExpression(criteria);
        const model = await this.transactionRepository.findOneByExpression(expression);
        return model ? this.convertModel(model) : undefined;
    }

    public async findManyByCriteria(
        criteria: Contracts.Shared.OrTransactionCriteria,
    ): Promise<Interfaces.ITransactionData[]> {
        const expression = await this.transactionFilter.getWhereExpression(criteria);
        const models = await this.transactionRepository.findManyByExpression(expression);
        return this.convertModels(models);
    }

    public async listByCriteria(
        criteria: Contracts.Shared.OrTransactionCriteria,
        order: Contracts.Shared.ListingOrder,
        page: Contracts.Shared.ListingPage,
    ): Promise<Contracts.Shared.ListingResult<Interfaces.ITransactionData>> {
        const expression = await this.transactionFilter.getWhereExpression(criteria);
        const listResult = await this.transactionRepository.listByExpression(expression, order, page);
        return this.convertListResult(listResult);
    }

    private convertModel(model: Transaction): Interfaces.ITransactionData {
        const data = this.transactionsManager.TransactionFactory.fromBytesUnsafe(model.serialized, model.id).data;
        data.nonce = model.nonce; // set_row_nonce trigger
        data.blockId = model.blockId; // block constructor
        return data;
    }

    private convertModels(models: Transaction[]): Interfaces.ITransactionData[] {
        return models.map((m) => this.convertModel(m));
    }

    private convertListResult(
        listResult: Contracts.Shared.ListingResult<Transaction>,
    ): Contracts.Shared.ListingResult<Interfaces.ITransactionData> {
        return {
            rows: this.convertModels(listResult.rows),
            count: listResult.count,
            countIsEstimate: listResult.countIsEstimate,
        };
    }
}
