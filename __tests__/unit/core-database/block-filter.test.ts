import { Container } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";

import { BlockFilter } from "../../../packages/core-database/src/block-filter";

const container = new Container.Container();

describe("BlockFilter.getExpression", () => {
    describe("BlockCriteria.id", () => {
        it("should compare using equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ id: "123" });

            expect(expression).toEqual({ property: "id", type: "equal", value: "123" });
        });
    });

    describe("BlockCriteria.version", () => {
        it("should compare using equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ version: 1 });

            expect(expression).toEqual({ property: "version", type: "equal", value: 1 });
        });
    });

    describe("BlockCriteria.timestamp", () => {
        it("should compare using equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ timestamp: 3600 });

            expect(expression).toEqual({ property: "timestamp", type: "equal", value: 3600 });
        });

        it("should compare using between expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ timestamp: { from: 3600, to: 7200 } });

            expect(expression).toEqual({ property: "timestamp", type: "between", from: 3600, to: 7200 });
        });

        it("should compare using greater than equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ timestamp: { from: 3600 } });

            expect(expression).toEqual({ property: "timestamp", type: "greaterThanEqual", from: 3600 });
        });

        it("should compare using less than equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ timestamp: { to: 3600 } });

            expect(expression).toEqual({ property: "timestamp", type: "lessThanEqual", to: 3600 });
        });
    });

    describe("BlockCriteria.previousBlock", () => {
        it("should compare using equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ previousBlock: "456" });

            expect(expression).toEqual({ property: "previousBlock", type: "equal", value: "456" });
        });
    });

    describe("BlockCriteria.height", () => {
        it("should compare using equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ height: 100 });

            expect(expression).toEqual({ property: "height", type: "equal", value: 100 });
        });

        it("should compare using between expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ height: { from: 100, to: 200 } });

            expect(expression).toEqual({ property: "height", type: "between", from: 100, to: 200 });
        });

        it("should compare using greater than equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ height: { from: 100 } });

            expect(expression).toEqual({ property: "height", type: "greaterThanEqual", from: 100 });
        });

        it("should compare using less than equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ height: { to: 100 } });

            expect(expression).toEqual({ property: "height", type: "lessThanEqual", to: 100 });
        });
    });

    describe("BlockCriteria.numberOfTransactions", () => {
        it("should compare using equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ numberOfTransactions: 10 });

            expect(expression).toEqual({ property: "numberOfTransactions", type: "equal", value: 10 });
        });

        it("should compare using between expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ numberOfTransactions: { from: 10, to: 20 } });

            expect(expression).toEqual({ property: "numberOfTransactions", type: "between", from: 10, to: 20 });
        });

        it("should compare using greater than equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ numberOfTransactions: { from: 10 } });

            expect(expression).toEqual({ property: "numberOfTransactions", type: "greaterThanEqual", from: 10 });
        });

        it("should compare using less than equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ numberOfTransactions: { to: 10 } });

            expect(expression).toEqual({ property: "numberOfTransactions", type: "lessThanEqual", to: 10 });
        });
    });

    describe("BlockCriteria.totalAmount", () => {
        it("should compare using equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ totalAmount: Utils.BigNumber.make("10000") });

            expect(expression).toEqual({
                property: "totalAmount",
                type: "equal",
                value: Utils.BigNumber.make("10000"),
            });
        });

        it("should compare using between expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({
                totalAmount: {
                    from: Utils.BigNumber.make("10000"),
                    to: Utils.BigNumber.make("20000"),
                },
            });

            expect(expression).toEqual({
                property: "totalAmount",
                type: "between",
                from: Utils.BigNumber.make("10000"),
                to: Utils.BigNumber.make("20000"),
            });
        });

        it("should compare using greater than equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({
                totalAmount: {
                    from: Utils.BigNumber.make("10000"),
                },
            });

            expect(expression).toEqual({
                property: "totalAmount",
                type: "greaterThanEqual",
                from: Utils.BigNumber.make("10000"),
            });
        });

        it("should compare using less than equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({
                totalAmount: {
                    to: Utils.BigNumber.make("10000"),
                },
            });

            expect(expression).toEqual({
                property: "totalAmount",
                type: "lessThanEqual",
                to: Utils.BigNumber.make("10000"),
            });
        });
    });

    describe("BlockCriteria.totalFee", () => {
        it("should compare using equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ totalFee: Utils.BigNumber.make("100") });

            expect(expression).toEqual({ property: "totalFee", type: "equal", value: Utils.BigNumber.make("100") });
        });

        it("should compare using between expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({
                totalFee: {
                    from: Utils.BigNumber.make("100"),
                    to: Utils.BigNumber.make("200"),
                },
            });

            expect(expression).toEqual({
                property: "totalFee",
                type: "between",
                from: Utils.BigNumber.make("100"),
                to: Utils.BigNumber.make("200"),
            });
        });

        it("should compare using greater than equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({
                totalFee: {
                    from: Utils.BigNumber.make("100"),
                },
            });

            expect(expression).toEqual({
                property: "totalFee",
                type: "greaterThanEqual",
                from: Utils.BigNumber.make("100"),
            });
        });

        it("should compare using less than equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({
                totalFee: {
                    to: Utils.BigNumber.make("100"),
                },
            });

            expect(expression).toEqual({
                property: "totalFee",
                type: "lessThanEqual",
                to: Utils.BigNumber.make("100"),
            });
        });
    });

    describe("BlockCriteria.reward", () => {
        it("should compare using equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ reward: Utils.BigNumber.make("1000") });

            expect(expression).toEqual({ property: "reward", type: "equal", value: Utils.BigNumber.make("1000") });
        });

        it("should compare using between expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({
                reward: {
                    from: Utils.BigNumber.make("1000"),
                    to: Utils.BigNumber.make("2000"),
                },
            });

            expect(expression).toEqual({
                property: "reward",
                type: "between",
                from: Utils.BigNumber.make("1000"),
                to: Utils.BigNumber.make("2000"),
            });
        });

        it("should compare using greater than equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({
                reward: {
                    from: Utils.BigNumber.make("1000"),
                },
            });

            expect(expression).toEqual({
                property: "reward",
                type: "greaterThanEqual",
                from: Utils.BigNumber.make("1000"),
            });
        });

        it("should compare using less than equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({
                reward: {
                    to: Utils.BigNumber.make("1000"),
                },
            });

            expect(expression).toEqual({ property: "reward", type: "lessThanEqual", to: Utils.BigNumber.make("1000") });
        });
    });

    describe("BlockCriteria.payloadLength", () => {
        it("should compare using equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ payloadLength: 1000 });

            expect(expression).toEqual({ property: "payloadLength", type: "equal", value: 1000 });
        });

        it("should compare using between expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ payloadLength: { from: 1000, to: 2000 } });

            expect(expression).toEqual({ property: "payloadLength", type: "between", from: 1000, to: 2000 });
        });

        it("should compare using greater than equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ payloadLength: { from: 1000 } });

            expect(expression).toEqual({ property: "payloadLength", type: "greaterThanEqual", from: 1000 });
        });

        it("should compare using less than equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ payloadLength: { to: 1000 } });

            expect(expression).toEqual({ property: "payloadLength", type: "lessThanEqual", to: 1000 });
        });
    });

    describe("BlockCriteria.payloadHash", () => {
        it("should compare using equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ payloadHash: "123" });

            expect(expression).toEqual({ property: "payloadHash", type: "equal", value: "123" });
        });
    });

    describe("BlockCriteria.generatorPublicKey", () => {
        it("should compare using equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ generatorPublicKey: "123" });

            expect(expression).toEqual({ property: "generatorPublicKey", type: "equal", value: "123" });
        });
    });

    describe("BlockCriteria.blockSignature", () => {
        it("should compare using equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({ blockSignature: "123" });

            expect(expression).toEqual({ property: "blockSignature", type: "equal", value: "123" });
        });
    });

    describe("BlockCriteria.height and BlockCriteria.generatorPublicKey", () => {
        it("should compare using equal expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression({
                height: { from: 100 },
                generatorPublicKey: "123",
            });

            expect(expression).toEqual({
                type: "and",
                expressions: [
                    { property: "height", type: "greaterThanEqual", from: 100 },
                    { property: "generatorPublicKey", type: "equal", value: "123" },
                ],
            });
        });
    });

    describe("OrBlockCriteria", () => {
        it("should join using or expression", async () => {
            const blockFilter = container.resolve(BlockFilter);
            const expression = await blockFilter.getExpression([
                { height: { from: 100 }, generatorPublicKey: "123" },
                { height: { from: 300 }, generatorPublicKey: "456" },
            ]);

            expect(expression).toEqual({
                type: "or",
                expressions: [
                    {
                        type: "and",
                        expressions: [
                            { property: "height", type: "greaterThanEqual", from: 100 },
                            { property: "generatorPublicKey", type: "equal", value: "123" },
                        ],
                    },
                    {
                        type: "and",
                        expressions: [
                            { property: "height", type: "greaterThanEqual", from: 300 },
                            { property: "generatorPublicKey", type: "equal", value: "456" },
                        ],
                    },
                ],
            });
        });
    });
});
