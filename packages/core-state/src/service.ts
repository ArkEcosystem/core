import { State } from "@arkecosystem/core-interfaces";
import { BlockStore } from "./stores/blocks";
import { TransactionStore } from "./stores/transactions";

export class StateService implements State.IStateService {
    private readonly blocks: BlockStore;
    private readonly transactions: TransactionStore;
    private readonly storage: State.IStateStore;

    public constructor({
        blocks,
        transactions,
        storage,
    }: {
        blocks: BlockStore;
        transactions: TransactionStore;
        storage: State.IStateStore;
    }) {
        this.blocks = blocks;
        this.transactions = transactions;
        this.storage = storage;
    }

    public getBlocks(): BlockStore {
        return this.blocks;
    }

    public getTransactions(): TransactionStore {
        return this.transactions;
    }

    public getStore(): State.IStateStore {
        return this.storage;
    }
}
