import "jest-extended";

import { Utils } from "@packages/core-kernel/src";
import { IBlockData } from "@packages/crypto/src/interfaces";

import { BlockFactory, Serializer } from "../../../../packages/crypto/src/blocks";
import { configManager } from "../../../../packages/crypto/src/managers";
import { blockWithExceptions, dummyBlock } from "../fixtures/block";

const purifyBlockData = (data: IBlockData) => {
    const transactions = data.transactions.map((tx) => {
        return Utils.filterObject(tx, (value, key) => {
            if (key === "blockHeight") return false;
            if (key === "secondSignature" && !value) return false;
            return true;
        });
    });

    return Utils.filterObject({ ...data, transactions }, (_, key) => {
        if (key === "idHex") return false;
        if (key === "previousBlockHex") return false;
        return true;
    });
};

beforeEach(() => configManager.setFromPreset("devnet"));

describe("BlockFactory", () => {
    describe(".fromHex", () => {
        it("should create a block instance from hex", () => {
            const block = BlockFactory.fromHex(Serializer.serialize(dummyBlock).toString("hex"));

            expect(purifyBlockData(block.data)).toEqual(dummyBlock);
        });
    });

    describe(".fromBytes", () => {
        it("should create a block instance from a buffer", () => {
            const block = BlockFactory.fromBytes(Serializer.serialize(dummyBlock));

            expect(purifyBlockData(block.data)).toEqual(dummyBlock);
        });
    });

    describe(".fromData", () => {
        it("should create a block instance from an object", () => {
            const block = BlockFactory.fromData(dummyBlock);

            expect(purifyBlockData(block.data)).toEqual(dummyBlock);
        });

        it("should create a block with exceptions", () => {
            // @ts-ignore
            expect(() => BlockFactory.fromData(blockWithExceptions)).not.toThrow();
        });

        it("should throw on invalid input data - block property has an unexpected value", () => {
            const b1 = Object.assign({}, blockWithExceptions, { timestamp: "abcd" });
            expect(() => BlockFactory.fromData(b1 as any)).toThrowError(
                /Invalid data at \.timestamp: should be integer/,
            );

            const b2 = Object.assign({}, blockWithExceptions, { totalAmount: "abcd" });
            expect(() => BlockFactory.fromData(b2 as any)).toThrowError(
                /Invalid data at \.totalAmount: should pass "bignumber" keyword validation/,
            );
        });

        it("should throw on invalid input data - required block property is missing", () => {
            const b = Object.assign({}, blockWithExceptions);
            delete b.generatorPublicKey;
            expect(() => BlockFactory.fromData(b as any)).toThrowError(
                /Invalid.*required property.*generatorPublicKey/i,
            );
        });
    });

    describe(".fromJson", () => {
        it("should create a block instance from JSON", () => {
            const json = BlockFactory.fromData(dummyBlock).toJson();
            const block = BlockFactory.fromJson(json);

            expect(purifyBlockData(block.data)).toEqual(dummyBlock);
        });
    });
});
