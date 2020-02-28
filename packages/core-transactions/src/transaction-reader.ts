import { Models, Repositories } from "@arkecosystem/core-database";
import { Container, Utils } from "@arkecosystem/core-kernel";
import { Transactions } from "@arkecosystem/crypto";

// TODO: read in chunks? use cursor? typeorm
// https://github.com/typeorm/typeorm/blob/master/docs/select-query-builder.md#streaming-result-data
@Container.injectable()
export class TransactionReader {
    public bufferSize: number = 1000000000;

    @Container.inject(Container.Identifiers.TransactionRepository)
    private transactionRepository!: Repositories.TransactionRepository;

    private type!: number;
    private typeGroup!: number;
    private index: number = 0;

    public initialize(typeConstructor: Transactions.TransactionConstructor): TransactionReader {
        Utils.assert.defined<number>(typeConstructor.type);
        Utils.assert.defined<number>(typeConstructor.typeGroup);

        this.type = typeConstructor.type;
        this.typeGroup = typeConstructor.typeGroup;
        this.index = 0;

        return this;
    }

    public async read(): Promise<Models.Transaction[]> {
        const transactions = await this.transactionRepository.findByType(
            this.type,
            this.typeGroup,
            this.bufferSize,
            this.index,
        );
        this.index += transactions.length;
        return transactions;
    }
}
