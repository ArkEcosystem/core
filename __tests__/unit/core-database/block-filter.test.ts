import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";

import { BlockFilter } from "../../../packages/core-database/src/block-filter";
import { QueryHelper } from "../../../packages/core-database/src/repositories/query-helper";

const container = new Container.Container();

const blockMetadata = {
    columns: [
        { propertyName: "id", databaseName: "id" },
        { propertyName: "version", databaseName: "version" },
        { propertyName: "timestamp", databaseName: "timestamp" },
        { propertyName: "previousBlock", databaseName: "previous_block" },
        { propertyName: "height", databaseName: "height" },
        { propertyName: "numberOfTransactions", databaseName: "number_of_transactions" },
        { propertyName: "totalAmount", databaseName: "total_amount" },
        { propertyName: "totalFee", databaseName: "total_fee" },
        { propertyName: "reward", databaseName: "reward" },
        { propertyName: "payloadLength", databaseName: "payload_length" },
        { propertyName: "payloadHash", databaseName: "payload_hash" },
        { propertyName: "generatorPublicKey", databaseName: "generator_public_key" },
        { propertyName: "blockSignature", databaseName: "block_signature" },
    ],
};

const getCriteriaSqlExpression = async (criteria: Contracts.Shared.OrBlockCriteria) => {
    const queryHelper = new QueryHelper();
    const blockFilter = container.resolve(BlockFilter);
    const whereExpression = await blockFilter.getWhereExpression(criteria);
    return queryHelper.getWhereExpressionSql(blockMetadata as any, whereExpression);
};

describe("BlockFilter.getWhereExpression", () => {
    describe("BlockCriteria.id", () => {
        it("should compare using equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ id: "123" });

            expect(sqlExpression.query).toEqual("id = :p1");
            expect(sqlExpression.parameters).toEqual({ p1: "123" });
        });
    });

    describe("BlockCriteria.version", () => {
        it("should compare using equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ version: 1 });

            expect(sqlExpression.query).toEqual("version = :p1");
            expect(sqlExpression.parameters).toEqual({ p1: 1 });
        });
    });

    describe("BlockCriteria.timestamp", () => {
        it("should compare using equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ timestamp: 3600 });

            expect(sqlExpression.query).toEqual("timestamp = :p1");
            expect(sqlExpression.parameters).toEqual({ p1: 3600 });
        });

        it("should compare using greater than equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ timestamp: { from: 3600 } });

            expect(sqlExpression.query).toEqual("timestamp >= :p1");
            expect(sqlExpression.parameters).toEqual({ p1: 3600 });
        });

        it("should compare using less than equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ timestamp: { to: 3600 } });

            expect(sqlExpression.query).toEqual("timestamp <= :p1");
            expect(sqlExpression.parameters).toEqual({ p1: 3600 });
        });

        it("should compare using between expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ timestamp: { from: 3600, to: 7200 } });

            expect(sqlExpression.query).toEqual("timestamp BETWEEN :p1 AND :p2");
            expect(sqlExpression.parameters).toEqual({ p1: 3600, p2: 7200 });
        });
    });

    describe("BlockCriteria.previousBlock", () => {
        it("should compare using equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ previousBlock: "456" });

            expect(sqlExpression.query).toEqual("previous_block = :p1");
            expect(sqlExpression.parameters).toEqual({ p1: "456" });
        });
    });

    describe("BlockCriteria.height", () => {
        it("should compare using equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ height: 100 });

            expect(sqlExpression.query).toEqual("height = :p1");
            expect(sqlExpression.parameters).toEqual({ p1: 100 });
        });

        it("should compare using greater than equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ height: { from: 100 } });

            expect(sqlExpression.query).toEqual("height >= :p1");
            expect(sqlExpression.parameters).toEqual({ p1: 100 });
        });

        it("should compare using less than equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ height: { to: 100 } });

            expect(sqlExpression.query).toEqual("height <= :p1");
            expect(sqlExpression.parameters).toEqual({ p1: 100 });
        });

        it("should compare using between expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ height: { from: 100, to: 200 } });

            expect(sqlExpression.query).toEqual("height BETWEEN :p1 AND :p2");
            expect(sqlExpression.parameters).toEqual({ p1: 100, p2: 200 });
        });
    });

    describe("BlockCriteria.numberOfTransactions", () => {
        it("should compare using equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ numberOfTransactions: 10 });

            expect(sqlExpression.query).toEqual("number_of_transactions = :p1");
            expect(sqlExpression.parameters).toEqual({ p1: 10 });
        });

        it("should compare using greater than equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ numberOfTransactions: { from: 10 } });

            expect(sqlExpression.query).toEqual("number_of_transactions >= :p1");
            expect(sqlExpression.parameters).toEqual({ p1: 10 });
        });

        it("should compare using less than equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ numberOfTransactions: { to: 10 } });

            expect(sqlExpression.query).toEqual("number_of_transactions <= :p1");
            expect(sqlExpression.parameters).toEqual({ p1: 10 });
        });

        it("should compare using between expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ numberOfTransactions: { from: 10, to: 20 } });

            expect(sqlExpression.query).toEqual("number_of_transactions BETWEEN :p1 AND :p2");
            expect(sqlExpression.parameters).toEqual({ p1: 10, p2: 20 });
        });
    });

    describe("BlockCriteria.totalAmount", () => {
        it("should compare using equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ totalAmount: Utils.BigNumber.make("10000") });

            expect(sqlExpression.query).toEqual("total_amount = :p1");
            expect(sqlExpression.parameters).toEqual({ p1: Utils.BigNumber.make("10000") });
        });

        it("should compare using greater than equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({
                totalAmount: { from: Utils.BigNumber.make("10000") },
            });

            expect(sqlExpression.query).toEqual("total_amount >= :p1");
            expect(sqlExpression.parameters).toEqual({ p1: Utils.BigNumber.make("10000") });
        });

        it("should compare using less than equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({
                totalAmount: { to: Utils.BigNumber.make("10000") },
            });

            expect(sqlExpression.query).toEqual("total_amount <= :p1");
            expect(sqlExpression.parameters).toEqual({ p1: Utils.BigNumber.make("10000") });
        });

        it("should compare using between expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({
                totalAmount: {
                    from: Utils.BigNumber.make("10000"),
                    to: Utils.BigNumber.make("20000"),
                },
            });

            expect(sqlExpression.query).toEqual("total_amount BETWEEN :p1 AND :p2");
            expect(sqlExpression.parameters).toEqual({
                p1: Utils.BigNumber.make("10000"),
                p2: Utils.BigNumber.make("20000"),
            });
        });
    });

    describe("BlockCriteria.totalFee", () => {
        it("should compare using equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ totalFee: Utils.BigNumber.make("10000") });

            expect(sqlExpression.query).toEqual("total_fee = :p1");
            expect(sqlExpression.parameters).toEqual({ p1: Utils.BigNumber.make("10000") });
        });

        it("should compare using greater than equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({
                totalFee: { from: Utils.BigNumber.make("10000") },
            });

            expect(sqlExpression.query).toEqual("total_fee >= :p1");
            expect(sqlExpression.parameters).toEqual({ p1: Utils.BigNumber.make("10000") });
        });

        it("should compare using less than equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({
                totalFee: { to: Utils.BigNumber.make("10000") },
            });

            expect(sqlExpression.query).toEqual("total_fee <= :p1");
            expect(sqlExpression.parameters).toEqual({ p1: Utils.BigNumber.make("10000") });
        });

        it("should compare using between expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({
                totalFee: {
                    from: Utils.BigNumber.make("10000"),
                    to: Utils.BigNumber.make("20000"),
                },
            });

            expect(sqlExpression.query).toEqual("total_fee BETWEEN :p1 AND :p2");
            expect(sqlExpression.parameters).toEqual({
                p1: Utils.BigNumber.make("10000"),
                p2: Utils.BigNumber.make("20000"),
            });
        });
    });

    describe("BlockCriteria.reward", () => {
        it("should compare using equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ reward: Utils.BigNumber.make("10000") });

            expect(sqlExpression.query).toEqual("reward = :p1");
            expect(sqlExpression.parameters).toEqual({ p1: Utils.BigNumber.make("10000") });
        });

        it("should compare using greater than equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({
                reward: { from: Utils.BigNumber.make("10000") },
            });

            expect(sqlExpression.query).toEqual("reward >= :p1");
            expect(sqlExpression.parameters).toEqual({ p1: Utils.BigNumber.make("10000") });
        });

        it("should compare using less than equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({
                reward: { to: Utils.BigNumber.make("10000") },
            });

            expect(sqlExpression.query).toEqual("reward <= :p1");
            expect(sqlExpression.parameters).toEqual({ p1: Utils.BigNumber.make("10000") });
        });

        it("should compare using between expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({
                reward: {
                    from: Utils.BigNumber.make("10000"),
                    to: Utils.BigNumber.make("20000"),
                },
            });

            expect(sqlExpression.query).toEqual("reward BETWEEN :p1 AND :p2");
            expect(sqlExpression.parameters).toEqual({
                p1: Utils.BigNumber.make("10000"),
                p2: Utils.BigNumber.make("20000"),
            });
        });
    });

    describe("BlockCriteria.payloadLength", () => {
        it("should compare using equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ payloadLength: 100 });

            expect(sqlExpression.query).toEqual("payload_length = :p1");
            expect(sqlExpression.parameters).toEqual({ p1: 100 });
        });

        it("should compare using greater than equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ payloadLength: { from: 100 } });

            expect(sqlExpression.query).toEqual("payload_length >= :p1");
            expect(sqlExpression.parameters).toEqual({ p1: 100 });
        });

        it("should compare using less than equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ payloadLength: { to: 100 } });

            expect(sqlExpression.query).toEqual("payload_length <= :p1");
            expect(sqlExpression.parameters).toEqual({ p1: 100 });
        });

        it("should compare using between expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ payloadLength: { from: 100, to: 200 } });

            expect(sqlExpression.query).toEqual("payload_length BETWEEN :p1 AND :p2");
            expect(sqlExpression.parameters).toEqual({ p1: 100, p2: 200 });
        });
    });

    describe("BlockCriteria.payloadHash", () => {
        it("should compare using equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ payloadHash: "123" });

            expect(sqlExpression.query).toEqual("payload_hash = :p1");
            expect(sqlExpression.parameters).toEqual({ p1: "123" });
        });
    });

    describe("BlockCriteria.generatorPublicKey", () => {
        it("should compare using equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ generatorPublicKey: "123" });

            expect(sqlExpression.query).toEqual("generator_public_key = :p1");
            expect(sqlExpression.parameters).toEqual({ p1: "123" });
        });
    });

    describe("BlockCriteria.blockSignature", () => {
        it("should compare using equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ blockSignature: "123" });

            expect(sqlExpression.query).toEqual("block_signature = :p1");
            expect(sqlExpression.parameters).toEqual({ p1: "123" });
        });
    });

    describe("BlockCriteria.height and BlockCriteria.generatorPublicKey", () => {
        it("should join using and expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ height: { from: 100 }, generatorPublicKey: "123" });

            expect(sqlExpression.query).toEqual("(height >= :p1 AND generator_public_key = :p2)");
            expect(sqlExpression.parameters).toEqual({ p1: 100, p2: "123" });
        });
    });

    describe("OrBlockCriteria", () => {
        it("should join using or expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression([
                { height: { from: 100 }, generatorPublicKey: "123" },
                { height: { from: 300 }, generatorPublicKey: "456" },
            ]);

            expect(sqlExpression.query).toEqual(
                "((height >= :p1 AND generator_public_key = :p2) OR (height >= :p3 AND generator_public_key = :p4))",
            );
            expect(sqlExpression.parameters).toEqual({ p1: 100, p2: "123", p3: 300, p4: "456" });
        });
    });
});
