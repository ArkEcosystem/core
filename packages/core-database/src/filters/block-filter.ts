import { Container, Contracts } from "@arkecosystem/core-kernel";

import { Block } from "../models";

@Container.injectable()
export class BlockFilter implements Contracts.Database.BlockFilter {
    private readonly handler = new Contracts.Database.CriteriaHandler<Block>();

    public async getCriteriaExpression(
        criteria: Contracts.Database.OrBlockCriteria,
    ): Promise<Contracts.Database.Expression<Block>> {
        return this.handler.handleOrCriteria(criteria, this.handleBlockCriteria.bind(this));
    }

    private async handleBlockCriteria(
        criteria: Contracts.Database.BlockCriteria,
    ): Promise<Contracts.Database.Expression<Block>> {
        return this.handler.handleAndCriteria(criteria, async (key) => {
            switch (key) {
                case "id":
                    return this.handler.handleOrEqualCriteria("id", criteria.id!);
                case "version":
                    return this.handler.handleOrEqualCriteria("version", criteria.version!);
                case "timestamp":
                    return this.handler.handleOrNumericCriteria("timestamp", criteria.timestamp!);
                case "previousBlock":
                    return this.handler.handleOrEqualCriteria("previousBlock", criteria.previousBlock!);
                case "height":
                    return this.handler.handleOrNumericCriteria("height", criteria.height!);
                case "numberOfTransactions":
                    return this.handler.handleOrNumericCriteria("numberOfTransactions", criteria.numberOfTransactions!);
                case "totalAmount":
                    return this.handler.handleOrNumericCriteria("totalAmount", criteria.totalAmount!);
                case "totalFee":
                    return this.handler.handleOrNumericCriteria("totalFee", criteria.totalFee!);
                case "reward":
                    return this.handler.handleOrNumericCriteria("reward", criteria.reward!);
                case "payloadLength":
                    return this.handler.handleOrNumericCriteria("payloadLength", criteria.payloadLength!);
                case "payloadHash":
                    return this.handler.handleOrEqualCriteria("payloadHash", criteria.payloadHash!);
                case "generatorPublicKey":
                    return this.handler.handleOrEqualCriteria("generatorPublicKey", criteria.generatorPublicKey!);
                case "blockSignature":
                    return this.handler.handleOrEqualCriteria("blockSignature", criteria.blockSignature!);
                default:
                    return new Contracts.Database.VoidExpression();
            }
        });
    }
}
