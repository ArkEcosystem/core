import "jest-extended";

import { Utils } from "@packages/core-kernel";
import { Generators } from "@packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import { Blocks, Interfaces } from "@packages/crypto";

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

    it("should create a single block with genesisBlock in options", () => {
        const genesisBlock: Blocks.Block = factory.get("Block").make();

        const options = {
            config: {
                genesisBlock: genesisBlock.data,
            },
        };

        const entity: Blocks.Block = factory.get("Block").withOptions(options).make();

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

    it("should create a single block with previous block in options", () => {
        const previousBlock: Blocks.Block = factory.get("Block").make();

        const options = {
            getPreviousBlock(): Interfaces.IBlockData {
                return previousBlock.data;
            },
        };

        const entity: Blocks.Block = factory.get("Block").withOptions(options).make();

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

    it("should create a single block with transactions in options", () => {
        const config = Generators.generateCryptoConfigRaw();

        const options = {
            transactionsCount: 1,
            config: config,
        };

        const entity: Blocks.Block = factory.get("Block").withOptions(options).make();

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
