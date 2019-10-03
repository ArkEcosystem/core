import "jest-extended";

import { Block, BlockFactory } from "../../../../packages/crypto/src/blocks";
import { IBlockData } from "../../../../packages/crypto/src/interfaces";
import { configManager } from "../../../../packages/crypto/src/managers";
import { blockWithExceptions, dummyBlock } from "../fixtures/block";

export const expectBlock = ({ data }: { data: IBlockData }) => {
    delete data.idHex;

    const blockWithoutTransactions: IBlockData = { ...dummyBlock };
    blockWithoutTransactions.reward = blockWithoutTransactions.reward;
    blockWithoutTransactions.totalAmount = blockWithoutTransactions.totalAmount;
    blockWithoutTransactions.totalFee = blockWithoutTransactions.totalFee;
    delete blockWithoutTransactions.transactions;

    expect(data).toEqual(blockWithoutTransactions);
};

beforeEach(() => configManager.setFromPreset("devnet"));

describe("BlockFactory", () => {
    describe(".fromHex", () => {
        it("should create a block instance from hex", () => {
            expectBlock(BlockFactory.fromHex(Block.serializeWithTransactions(dummyBlock).toString("hex")));
        });
    });

    describe(".fromBytes", () => {
        it("should create a block instance from a buffer", () => {
            expectBlock(BlockFactory.fromBytes(Block.serializeWithTransactions(dummyBlock)));
        });
    });

    describe(".fromData", () => {
        it("should create a block instance from an object", () => {
            expectBlock(BlockFactory.fromData(dummyBlock));
        });

        it("should create a block with exceptions", () => {
            // @ts-ignore
            expect(() => BlockFactory.fromData(blockWithExceptions)).not.toThrow();
        });
    });

    describe(".fromJson", () => {
        it("should create a block instance from JSON", () => {
            expectBlock(BlockFactory.fromJson(BlockFactory.fromData(dummyBlock).toJson()));
        });
    });
});
