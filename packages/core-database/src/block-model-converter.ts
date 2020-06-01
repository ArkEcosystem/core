import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { Block } from "./models/block";

@Container.injectable()
export class BlockModelConverter implements Contracts.Database.BlockModelConverter {
    @Container.inject(Container.Identifiers.DatabaseTransactionModelConverter)
    private readonly transactionModelConverter!: Contracts.Database.TransactionModelConverter;

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
        const transactionData = this.transactionModelConverter.getTransactionData(transactionModels);

        const blockDataWithTransactions = blockData.map((data) => {
            const transactions = transactionData.filter((t) => t.blockId === data.id);
            return { data, transactions };
        });

        return blockDataWithTransactions;
    }
}
