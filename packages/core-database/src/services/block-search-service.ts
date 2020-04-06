import { Container, Contracts } from "@arkecosystem/core-kernel";

import { Block } from "../models/block";

const { createAndFilter, createValueFilter, createNumericFilter, createOrFilter } = Contracts.Database;

@Container.injectable()
export class BlockSearchService implements Contracts.Database.BlockSearchService {
    private readonly filter = createAndFilter<Block, Contracts.Database.BlockCriteria>({
        id: createOrFilter(createValueFilter(Block, "id")),
        version: createOrFilter(createValueFilter(Block, "version")),
        timestamp: createOrFilter(createNumericFilter(Block, "timestamp")),
        previousBlock: createOrFilter(createValueFilter(Block, "previousBlock")),
        height: createOrFilter(createNumericFilter(Block, "height")),
        numberOfTransactions: createOrFilter(createNumericFilter(Block, "numberOfTransactions")),
        totalAmount: createOrFilter(createNumericFilter(Block, "totalAmount")),
        totalFee: createOrFilter(createNumericFilter(Block, "totalFee")),
        reward: createOrFilter(createNumericFilter(Block, "reward")),
        payloadLength: createOrFilter(createNumericFilter(Block, "payloadLength")),
        payloadHash: createOrFilter(createValueFilter(Block, "payloadHash")),
        generatorPublicKey: createOrFilter(createValueFilter(Block, "generatorPublicKey")),
        blockSignature: createOrFilter(createValueFilter(Block, "blockSignature")),
    });

    public async search(
        criteria: Contracts.Database.BlockCriteria,
        order: Contracts.Database.SearchOrder<Contracts.Database.Block>,
        page: Contracts.Database.SearchPage,
    ): Promise<Contracts.Database.SearchResult<Block>> {
        throw new Error("Method not implemented.");
    }
}
