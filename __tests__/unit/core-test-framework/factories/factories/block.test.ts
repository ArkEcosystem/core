import "jest-extended";

import { FactoryBuilder, Factories } from "@packages/core-test-framework/src/factories";
import { Interfaces } from "@arkecosystem/crypto";

let factory: FactoryBuilder;

beforeEach(() => {
    factory = new FactoryBuilder();

    Factories.registerBlockFactory(factory);
});

describe("BlockFactory", () => {
    it("should create a single block", () => {
        const entity: Interfaces.IBlockJson = factory.get("Block").make();

        expect(entity).toContainAllKeys([
            "blockSignature",
            "generatorPublicKey",
            "height",
            "id",
            "idHex",
            "numberOfTransactions",
            "payloadHash",
            "payloadLength",
            "previousBlock",
            "previousBlockHex",
            "reward",
            "serialized",
            "timestamp",
            "totalAmount",
            "totalFee",
            "transactions",
            "version",
        ]);

        expect(entity.blockSignature).toBeString();
        expect(entity.generatorPublicKey).toBeString();
        expect(entity.height).toBeNumber();
        expect(entity.id).toBeString();
        expect(entity.idHex).toBeString();
        expect(entity.numberOfTransactions).toBeNumber();
        expect(entity.payloadHash).toBeString();
        expect(entity.payloadLength).toBeNumber();
        expect(entity.previousBlock).toBeString();
        expect(entity.previousBlockHex).toBeString();
        expect(entity.reward).toBeString();
        expect(entity.serialized).toBeString();
        expect(entity.timestamp).toBeNumber();
        expect(entity.totalAmount).toBeString();
        expect(entity.totalFee).toBeString();
        expect(entity.transactions).toBeArray();
        expect(entity.version).toBeNumber();
    });
});
