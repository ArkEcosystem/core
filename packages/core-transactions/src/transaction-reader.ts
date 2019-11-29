import { Database } from "@arkecosystem/core-interfaces";
import { Transactions } from "@arkecosystem/crypto";

export class TransactionReader {
    public static async create(
        connection: Database.IConnection,
        typeConstructor: Transactions.TransactionConstructor,
    ): Promise<TransactionReader> {
        const reader: TransactionReader = new TransactionReader(
            connection,
            typeConstructor.type,
            typeConstructor.typeGroup,
        );
        await reader.init();
        return reader;
    }

    public bufferSize: number = 1000000000;

    private index: number;
    private count: number;

    private constructor(private connection: Database.IConnection, private type: number, private typeGroup: number) {}

    public hasNext(): boolean {
        return this.index < this.count;
    }

    public async read(): Promise<Database.IBootstrapTransaction[]> {
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
