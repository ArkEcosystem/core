import { State } from "@arkecosystem/core-interfaces";
import { BlockStore } from "./stores/blocks";
import { TransactionStore } from "./stores/transactions";
export declare class StateService implements State.IStateService {
    private readonly blocks;
    private readonly transactions;
    private readonly storage;
    constructor({ blocks, transactions, storage, }: {
        blocks: BlockStore;
        transactions: TransactionStore;
        storage: State.IStateStore;
    });
    getBlocks(): BlockStore;
    getTransactions(): TransactionStore;
    getStore(): State.IStateStore;
}
