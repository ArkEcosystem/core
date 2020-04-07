import { Container, Contracts } from "@arkecosystem/core-kernel";

import { Transaction } from "../models";
import { TransactionRepository } from "../repositories";

@Container.injectable()
export class TransactionService implements Contracts.Database.TransactionService {
    @Container.inject(Container.Identifiers.TransactionRepository)
    private readonly transactionRepository!: TransactionRepository;

    @Container.inject(Container.Identifiers.DatabaseTransactionFilter)
    private readonly transactionFilter!: Contracts.Database.Filter<
        Contracts.Database.Transaction,
        Contracts.Database.TransactionCriteria
    >;

    private readonly orTransactionFilter = new Contracts.Database.OrFnFilter<
        Transaction,
        Contracts.Database.TransactionCriteria
    >(criteria => this.transactionFilter.getExpression(criteria));

    public async search(
        criteria: Contracts.Database.OrTransactionCriteria,
        order?: string,
        page?: Contracts.Database.SearchPage,
    ): Promise<Contracts.Database.SearchResult<Transaction>> {
        const searchOrder = order ? Contracts.Database.SearchOrder.parse<Transaction>(order) : undefined;
        return this.transactionRepository.search(
            await this.orTransactionFilter.getExpression(criteria),
            searchOrder,
            page,
        );
    }

    public async searchOne(criteria: Contracts.Database.TransactionCriteria): Promise<Transaction> {
        const searchResults = await this.search(criteria, undefined, { offset: 0, limit: 1 });
        if (searchResults.count === 0) {
            throw new Contracts.Database.NotFoundError();
        }
        if (searchResults.count !== 1) {
            throw new Contracts.Database.ToManyRowsError();
        }
        return searchResults.rows[0];
    }
}
