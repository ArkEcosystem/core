import "jest-extended";

import { CryptoSuite } from "@packages/core-crypto";
import { IBlockData } from "@packages/core-crypto/src/interfaces";

import { blockWithExceptions, makeDummyBlock } from "../fixtures/block";

export const expectBlock = ({ data }: { data: IBlockData }) => {
    delete data.idHex;

    const blockWithoutTransactions: IBlockData = { ...dummyBlock };
    blockWithoutTransactions.reward = blockWithoutTransactions.reward;
    blockWithoutTransactions.totalAmount = blockWithoutTransactions.totalAmount;
    blockWithoutTransactions.totalFee = blockWithoutTransactions.totalFee;
    delete blockWithoutTransactions.transactions;

    expect(data).toEqual(blockWithoutTransactions);
};

const getTimeStampForBlock = (height: number) => {
    switch (height) {
        case 1:
            return 0;
        default:
            throw new Error(`Test scenarios should not hit this line`);
    }
};
let crypto: CryptoSuite.CryptoSuite;
let dummyBlock;
let Serializer;
let BlockFactory;

beforeEach(() => {
    crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("devnet"));
    Serializer = crypto.BlockFactory.serializer;
    BlockFactory = crypto.BlockFactory;
    dummyBlock = makeDummyBlock(crypto.CryptoManager);
});

describe("BlockFactory", () => {
    describe(".fromHex", () => {
        it("should create a block instance from hex", () => {
            expectBlock(
                BlockFactory.fromHex(
                    Serializer.serializeWithTransactions(dummyBlock).toString("hex"),
                    getTimeStampForBlock,
                ),
            );
        });
    });

    describe(".fromBytes", () => {
        it("should create a block instance from a buffer", () => {
            expectBlock(BlockFactory.fromBytes(Serializer.serializeWithTransactions(dummyBlock), getTimeStampForBlock));
        });
    });

    describe(".fromData", () => {
        it("should create a block instance from an object", () => {
            expectBlock(BlockFactory.fromData(dummyBlock, getTimeStampForBlock));
        });

        it("should create a block with exceptions", () => {
            // @ts-ignore
            expect(() => BlockFactory.fromData(blockWithExceptions)).not.toThrow();
        });

        it("should throw on invalid input data - block property has an unexpected value", () => {
            const b1 = Object.assign({}, blockWithExceptions, { timestamp: "abcd" });
            expect(() => BlockFactory.fromData(b1 as any, getTimeStampForBlock)).toThrowError(
                /Invalid.*timestamp.*integer.*abcd/i,
            );

            const b2 = Object.assign({}, blockWithExceptions, { totalAmount: "abcd" });
            expect(() => BlockFactory.fromData(b2 as any, getTimeStampForBlock)).toThrowError(
                /Invalid.*totalAmount.*bignumber.*abcd/i,
            );
        });

        it("should throw on invalid input data - required block property is missing", () => {
            const b = Object.assign({}, blockWithExceptions);
            delete b.generatorPublicKey;
            expect(() => BlockFactory.fromData(b as any, getTimeStampForBlock)).toThrowError(
                /Invalid.*required property.*generatorPublicKey/i,
            );
        });
    });

    describe(".fromJson", () => {
        it("should create a block instance from JSON", () => {
            expectBlock(
                BlockFactory.fromJson(
                    BlockFactory.fromData(dummyBlock, getTimeStampForBlock).toJson(),
                    getTimeStampForBlock,
                ),
            );
        });
    });
});
