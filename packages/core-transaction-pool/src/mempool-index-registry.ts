import { Container, Contracts } from "@arkecosystem/core-kernel";

import { MempoolIndex } from "./mempool-index";

@Container.injectable()
export class MempoolIndexRegistry implements Contracts.TransactionPool.MempoolIndexRegistry {
    @Container.multiInject(Container.Identifiers.TransactionPoolMempoolIndex)
    @Container.optional()
    private readonly indexNames?: string[];

    private readonly indexes: Map<string, MempoolIndex> = new Map();

    @Container.postConstruct()
    public initialize(): void {
        for (const indexName of this.indexNames || []) {
            this.indexes.set(indexName, new MempoolIndex());
        }
    }

    public get(indexName: string): MempoolIndex {
        if (this.indexes.has(indexName)) {
            return this.indexes.get(indexName)!;
        }

        throw new Error(`Index ${indexName} does not exists`);
    }

    public clear(): void {
        for (const index of this.indexes.values()) {
            index.clear();
        }
    }
}
