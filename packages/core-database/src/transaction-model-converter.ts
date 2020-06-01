import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

import { Transaction } from "./models/transaction";

@Container.injectable()
export class TransactionModelConverter implements Contracts.Database.TransactionModelConverter {
    public getTransactionModels(transactions: Interfaces.ITransaction[]): Contracts.Database.TransactionModel[] {
        return transactions.map((t) => {
            return Object.assign(new Transaction(), t.data, {
                timestamp: t.timestamp,
                serialized: t.serialized,
            });
        });
    }

    public getTransactionData(models: Contracts.Database.TransactionModel[]): Interfaces.ITransactionData[] {
        return models.map((model) => {
            const data = Transactions.TransactionFactory.fromBytesUnsafe(model.serialized, model.id).data;

            // set_row_nonce trigger
            data.nonce = model.nonce;

            // block constructor
            data.blockId = model.blockId;
            data.sequence = model.sequence;

            return data;
        });
    }
}
