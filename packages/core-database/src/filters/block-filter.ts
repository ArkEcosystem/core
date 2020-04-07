import { Container, Contracts } from "@arkecosystem/core-kernel";

import { Block } from "../models";

@Container.injectable()
export class BlockFilter
    implements Contracts.Database.Filter<Contracts.Database.Block, Contracts.Database.BlockCriteria> {
    private readonly filter = new Contracts.Database.AndFilter<Block, Contracts.Database.BlockCriteria>({
        id: new Contracts.Database.OrEqualFilter("id"),
        version: new Contracts.Database.OrEqualFilter("version"),
        timestamp: new Contracts.Database.OrNumericFilter("timestamp"),
        previousBlock: new Contracts.Database.OrEqualFilter("previousBlock"),
        height: new Contracts.Database.OrNumericFilter("height"),
        numberOfTransactions: new Contracts.Database.OrNumericFilter("numberOfTransactions"),
        totalAmount: new Contracts.Database.OrNumericFilter("totalAmount"),
        totalFee: new Contracts.Database.OrNumericFilter("totalFee"),
        reward: new Contracts.Database.OrNumericFilter("reward"),
        payloadLength: new Contracts.Database.OrNumericFilter("payloadLength"),
        payloadHash: new Contracts.Database.OrEqualFilter("payloadHash"),
        generatorPublicKey: new Contracts.Database.OrEqualFilter("generatorPublicKey"),
        blockSignature: new Contracts.Database.OrEqualFilter("blockSignature"),
    });

    public async getExpression(
        criteria: Contracts.Database.BlockCriteria,
    ): Promise<Contracts.Database.Expression<Block>> {
        return this.filter.getExpression(criteria);
    }
}
