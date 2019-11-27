import "jest-extended";

import { Utils } from "@arkecosystem/core-kernel";
import { Blocks } from "@arkecosystem/crypto";
import { FactoryBuilder, Factories } from "@packages/core-test-framework/src/factories";

let factory: FactoryBuilder;

beforeEach(() => {
    factory = new FactoryBuilder();

    Factories.registerBlockFactory(factory);
});

describe("BlockFactory", () => {
    it("should create a single block", () => {
        const entity: Blocks.Block = factory.get("Block").make();

        expect(entity).toBeInstanceOf(Blocks.Block);
        expect(entity.data.blockSignature).toBeString();
        expect(entity.data.generatorPublicKey).toBeString();
        expect(entity.data.height).toBeNumber();
        expect(entity.data.id).toBeString();
        expect(entity.data.idHex).toBeString();
        expect(entity.data.numberOfTransactions).toBeNumber();
        expect(entity.data.payloadHash).toBeString();
        expect(entity.data.payloadLength).toBeNumber();
        expect(entity.data.previousBlock).toBeString();
        expect(entity.data.previousBlockHex).toBeString();
        expect(entity.data.reward).toBeInstanceOf(Utils.BigNumber);
        expect(entity.data.timestamp).toBeNumber();
        expect(entity.data.totalAmount).toBeInstanceOf(Utils.BigNumber);
        expect(entity.data.totalFee).toBeInstanceOf(Utils.BigNumber);
        expect(entity.data.version).toBeNumber();

        expect(entity.serialized).toBeString();
        expect(entity.transactions).toBeArray();
    });
});
