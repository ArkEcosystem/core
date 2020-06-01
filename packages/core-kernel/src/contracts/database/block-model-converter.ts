import { Interfaces } from "@arkecosystem/crypto";

import { BlockDataWithTransactionData } from "../shared";
import { BlockModel, TransactionModel } from "./models";

export interface BlockModelConverter {
    getBlockModels(blocks: Interfaces.IBlock[]): BlockModel[];
    getBlockData(models: BlockModel[]): Interfaces.IBlockData[];
    getBlockDataWithTransactionData(
        blockModels: BlockModel[],
        transactionModels: TransactionModel[],
    ): BlockDataWithTransactionData[];
}
