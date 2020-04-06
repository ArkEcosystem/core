import { BlockCriteria, TransactionCriteria } from "./criteria";
import { Block, Transaction } from "./models";

export type SearchResult<TModel> = {
    rows: TModel[];
    count: number;
    countIsEstimate: boolean;
};

export type SearchOrder<TModel> = (keyof TModel)[];

export type SearchPage = {
    offset: number;
    limit: number;
};

export interface BlockSearchService {
    search(criteria: BlockCriteria, order: SearchOrder<Block>, page: SearchPage): Promise<SearchResult<Block>>;
}

export interface TransactionSearchService {
    search(
        criteria: TransactionCriteria,
        order: SearchOrder<Transaction>,
        page: SearchPage,
    ): Promise<SearchResult<Transaction>>;
}
