import { Interfaces as BlockInterfaces } from "@arkecosystem/core-crypto";
import { Interfaces } from "@arkecosystem/crypto";

import { BlockDataWithTransactionData } from "../shared/block-history-service";
import { TransactionDataWithBlockData } from "../shared/transaction-history-service";
import { BlockModel, TransactionModel } from "./models";

export interface ModelConverter {
    getBlockModels(blocks: BlockInterfaces.IBlock[]): BlockModel[];
    getBlockData(models: BlockModel[]): BlockInterfaces.IBlockData[];
    getBlockDataWithTransactionData(
        blockModels: BlockModel[],
        transactionModels: TransactionModel[],
    ): BlockDataWithTransactionData[];

    getTransactionModels(transactions: Interfaces.ITransaction[]): TransactionModel[];
    getTransactionData(models: TransactionModel[]): Interfaces.ITransactionData[];
    getTransactionDataWithBlockData(
        transactionModels: TransactionModel[],
        blockModels: BlockModel[],
    ): TransactionDataWithBlockData[];
}
