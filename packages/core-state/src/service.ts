import { Contracts } from "@arkecosystem/core-kernel";
import { BlockStore } from "./stores/blocks";
import { TransactionStore } from "./stores/transactions";

export class StateService implements Contracts.State.IStateService {
    private readonly blocks: BlockStore;
    private readonly transactions: TransactionStore;
    private readonly storage: Contracts.State.IStateStore;

    public constructor({
        blocks,
        transactions,
        storage,
    }: {
        blocks: BlockStore;
        transactions: TransactionStore;
        storage: Contracts.State.IStateStore;
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

    public getStore(): Contracts.State.IStateStore {
        return this.storage;
    }
}
