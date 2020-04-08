import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { Transaction } from "../models";
import { TransactionRepository } from "../repositories";

@Container.injectable()
export class TransactionService implements Contracts.Database.TransactionService {
    @Container.inject(Container.Identifiers.TransactionRepository)
    private readonly transactionRepository!: TransactionRepository;

    @Container.inject(Container.Identifiers.DatabaseTransactionFilter)
    private readonly transactionFilter!: Contracts.Database.TransactionFilter;

    public async search(
        criteria: Contracts.Database.OrTransactionCriteria,
        order?: string,
        page?: Contracts.Database.SearchPage,
    ): Promise<Contracts.Database.SearchResult<Interfaces.ITransactionData>> {
        const searchOrder = order ? Contracts.Database.SearchOrder.parse<Transaction>(order) : undefined;

        return this.transactionRepository.search(
            await this.transactionFilter.getExpression(criteria),
            searchOrder,
            page,
        );
    }
}
