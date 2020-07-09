import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

import { Block } from "./models/block";
import { Transaction } from "./models/transaction";

@Container.injectable()
export class ModelConverter implements Contracts.Database.ModelConverter {
    public getBlockModels(blocks: Interfaces.IBlock[]): Contracts.Database.BlockModel[] {
        return blocks.map((b) => Object.assign(new Block(), b.data));
    }

    public getBlockData(models: Contracts.Database.BlockModel[]): Interfaces.IBlockData[] {
        return models;
    }

    public getBlockDataWithTransactionData(
        blockModels: Contracts.Database.BlockModel[],
        transactionModels: Contracts.Database.TransactionModel[],
    ): Contracts.Shared.BlockDataWithTransactionData[] {
        const blockData = this.getBlockData(blockModels);
        const transactionData = this.getTransactionData(transactionModels);

        const blockDataWithTransactions = blockData.map((data) => {
            const transactions = transactionData.filter((t) => t.blockId === data.id);
            return { data, transactions };
        });

        return blockDataWithTransactions;
    }

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
            data.blockHeight = model.blockHeight;
            data.sequence = model.sequence;

            return data;
        });
    }

    public getTransactionDataWithBlockData(
        transactionModels: Contracts.Database.TransactionModel[],
        blockModels: Contracts.Database.BlockModel[],
    ): Contracts.Shared.TransactionDataWithBlockData[] {
        const transactionData = this.getTransactionData(transactionModels);
        const blockData = this.getBlockData(blockModels);

        return transactionData.map((data) => {
            const block = blockData.find((b) => b.id === data.blockId);
            AppUtils.assert.defined<Interfaces.IBlockData>(block);
            return { data, block };
        });
    }
}
