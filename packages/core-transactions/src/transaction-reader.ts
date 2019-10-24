import { Contracts, Utils } from "@arkecosystem/core-kernel";
import { Transactions } from "@arkecosystem/crypto";

export class TransactionReader {
    public static async create(
        connection: Contracts.Database.Connection,
        typeConstructor: Transactions.TransactionConstructor,
    ): Promise<TransactionReader> {
        const reader: TransactionReader = new TransactionReader(
            connection,
            Utils.assert.defined(typeConstructor.type),
            Utils.assert.defined(typeConstructor.typeGroup),
        );

        await reader.init();

        return reader;
    }

    public bufferSize: number = 1000000000;

    private index: number = 0;
    private count: number = 0;

    private constructor(
        private connection: Contracts.Database.Connection,
        private type: number,
        private typeGroup: number,
    ) {}

    public hasNext(): boolean {
        return this.index < this.count;
    }

    public async read(): Promise<Contracts.Database.IBootstrapTransaction[]> {
        const transactions = await this.connection.transactionsRepository.getAssetsByType(
            this.type,
            this.typeGroup,
            this.bufferSize,
            this.index,
        );
        this.index += transactions.length;
        return transactions;
    }

    private async init(): Promise<void> {
        this.index = 0;
        this.count = await this.connection.transactionsRepository.getCountOfType(this.type, this.typeGroup);
    }
}
