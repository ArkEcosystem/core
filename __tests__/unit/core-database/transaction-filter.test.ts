import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums, Utils } from "@arkecosystem/crypto";

import { QueryHelper } from "../../../packages/core-database/src/repositories/query-helper";
import { TransactionFilter } from "../../../packages/core-database/src/transaction-filter";

const container = new Container.Container();

const walletRepository = {
    findByAddress: jest.fn(),
};

container.bind(Container.Identifiers.WalletRepository).toConstantValue(walletRepository);

const transactionMetadata = {
    columns: [
        { propertyName: "id", databaseName: "id" },
        { propertyName: "version", databaseName: "version" },
        { propertyName: "blockId", databaseName: "block_id" },
        { propertyName: "sequence", databaseName: "sequence" },
        { propertyName: "timestamp", databaseName: "timestamp" },
        { propertyName: "nonce", databaseName: "nonce" },
        { propertyName: "senderPublicKey", databaseName: "sender_public_key" },
        { propertyName: "recipientId", databaseName: "recipient_id" },
        { propertyName: "type", databaseName: "type" },
        { propertyName: "typeGroup", databaseName: "type_group" },
        { propertyName: "vendorField", databaseName: "vendor_field" },
        { propertyName: "amount", databaseName: "amount" },
        { propertyName: "fee", databaseName: "fee" },
        { propertyName: "asset", databaseName: "asset" },
    ],
};

const getCriteriaSqlExpression = async (criteria: Contracts.Shared.OrTransactionCriteria) => {
    const queryHelper = new QueryHelper();
    const blockFilter = container.resolve(TransactionFilter);
    const whereExpression = await blockFilter.getWhereExpression(criteria);
    return queryHelper.getWhereExpressionSql(transactionMetadata as any, whereExpression);
};

beforeEach(() => {
    walletRepository.findByAddress.mockReset();
});

describe("TransactionFilter.getWhereExpression", () => {
    describe("TransactionCriteria.senderId", () => {
        it("should compare sender_public_key using equal expression", async () => {
            walletRepository.findByAddress.mockReturnValueOnce({
                publicKey: "456",
            });

            const sqlExpression = await getCriteriaSqlExpression({ senderId: "123" });

            expect(walletRepository.findByAddress).toBeCalledWith("123");
            expect(sqlExpression.query).toEqual("sender_public_key = :p1");
            expect(sqlExpression.parameters).toEqual({ p1: "456" });
        });

        it("should produce false expression when wallet not found", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ senderId: "123" });

            expect(sqlExpression.query).toEqual("FALSE");
            expect(sqlExpression.parameters).toEqual({});
        });
    });

    describe("TransactionCriteria.id", () => {
        it("should compare using equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ id: "123" });

            expect(sqlExpression.query).toEqual("id = :p1");
            expect(sqlExpression.parameters).toEqual({ p1: "123" });
        });
    });

    describe("TransactionCriteria.version", () => {
        it("should compare using equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ version: 2 });

            expect(sqlExpression.query).toEqual("version = :p1");
            expect(sqlExpression.parameters).toEqual({ p1: 2 });
        });
    });

    describe("TransactionCriteria.blockId", () => {
        it("should compare using equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ blockId: "123" });

            expect(sqlExpression.query).toEqual("block_id = :p1");
            expect(sqlExpression.parameters).toEqual({ p1: "123" });
        });
    });

    describe("TransactionCriteria.sequence", () => {
        it("should compare using equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ sequence: 5 });

            expect(sqlExpression.query).toEqual("sequence = :p1");
            expect(sqlExpression.parameters).toEqual({ p1: 5 });
        });

        it("should compare using greater than equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ sequence: { from: 5 } });

            expect(sqlExpression.query).toEqual("sequence >= :p1");
            expect(sqlExpression.parameters).toEqual({ p1: 5 });
        });

        it("should compare using less than equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ sequence: { to: 5 } });

            expect(sqlExpression.query).toEqual("sequence <= :p1");
            expect(sqlExpression.parameters).toEqual({ p1: 5 });
        });

        it("should compare using between expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ sequence: { from: 5, to: 10 } });

            expect(sqlExpression.query).toEqual("sequence BETWEEN :p1 AND :p2");
            expect(sqlExpression.parameters).toEqual({ p1: 5, p2: 10 });
        });
    });

    describe("TransactionCriteria.timestamp", () => {
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

    describe("TransactionCriteria.nonce", () => {
        it("should compare using equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ nonce: Utils.BigNumber.make("5") });

            expect(sqlExpression.query).toEqual("nonce = :p1");
            expect(sqlExpression.parameters).toEqual({ p1: Utils.BigNumber.make("5") });
        });

        it("should compare using greater than equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({
                nonce: { from: Utils.BigNumber.make("5") },
            });

            expect(sqlExpression.query).toEqual("nonce >= :p1");
            expect(sqlExpression.parameters).toEqual({ p1: Utils.BigNumber.make("5") });
        });

        it("should compare using less than equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({
                nonce: { to: Utils.BigNumber.make("5") },
            });

            expect(sqlExpression.query).toEqual("nonce <= :p1");
            expect(sqlExpression.parameters).toEqual({ p1: Utils.BigNumber.make("5") });
        });

        it("should compare using between expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({
                nonce: {
                    from: Utils.BigNumber.make("5"),
                    to: Utils.BigNumber.make("10"),
                },
            });

            expect(sqlExpression.query).toEqual("nonce BETWEEN :p1 AND :p2");
            expect(sqlExpression.parameters).toEqual({
                p1: Utils.BigNumber.make("5"),
                p2: Utils.BigNumber.make("10"),
            });
        });
    });

    describe("TransactionCriteria.senderPublicKey", () => {
        it("should compare using equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ senderPublicKey: "123" });

            expect(sqlExpression.query).toEqual("sender_public_key = :p1");
            expect(sqlExpression.parameters).toEqual({ p1: "123" });
        });
    });

    describe("TransactionCriteria.recipientId", () => {
        it("should compare using equal expression and include delegate registration transaction", async () => {
            walletRepository.findByAddress.mockReturnValueOnce({
                publicKey: "456",
            });

            const sqlExpression = await getCriteriaSqlExpression({ recipientId: "123" });

            expect(walletRepository.findByAddress).toBeCalledWith("123");
            expect(sqlExpression.query).toEqual(
                "(recipient_id = :p1 OR (type_group = :p2 AND type = :p3 AND sender_public_key = :p4))",
            );
            expect(sqlExpression.parameters).toEqual({
                p1: "123",
                p2: Enums.TransactionTypeGroup.Core,
                p3: Enums.TransactionType.DelegateRegistration,
                p4: "456",
            });
        });

        it("should compare using only equal expression when wallet not found", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ recipientId: "123" });

            expect(sqlExpression.query).toEqual("recipient_id = :p1");
            expect(sqlExpression.parameters).toEqual({ p1: "123" });
        });
    });

    describe("TransactionCriteria.type", () => {
        it("should compare using equal expression and add core type group expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ type: Enums.TransactionType.Vote });

            expect(sqlExpression.query).toEqual("(type = :p1 AND type_group = :p2)");
            expect(sqlExpression.parameters).toEqual({
                p1: Enums.TransactionType.Vote,
                p2: Enums.TransactionTypeGroup.Core,
            });
        });

        it("should compare using equal expression and use existing type group expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({
                typeGroup: Enums.TransactionTypeGroup.Test,
                type: Enums.TransactionType.Vote,
            });

            expect(sqlExpression.query).toEqual("(type_group = :p1 AND type = :p2)");
            expect(sqlExpression.parameters).toEqual({
                p1: Enums.TransactionTypeGroup.Test,
                p2: Enums.TransactionType.Vote,
            });
        });
    });

    describe("TransactionCriteria.typeGroup", () => {
        it("should compare using equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ typeGroup: Enums.TransactionTypeGroup.Core });

            expect(sqlExpression.query).toEqual("type_group = :p1");
            expect(sqlExpression.parameters).toEqual({
                p1: Enums.TransactionTypeGroup.Core,
            });
        });
    });

    describe("TransactionCriteria.vendorField", () => {
        it("should compare using like expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ vendorField: "%pattern%" });

            expect(sqlExpression.query).toEqual("vendor_field LIKE :p1");
            expect(sqlExpression.parameters).toEqual({
                p1: "%pattern%",
            });
        });
    });

    describe("TransactionCriteria.amount", () => {
        it("should compare using equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ amount: Utils.BigNumber.make("10000") });

            expect(sqlExpression.query).toEqual("amount = :p1");
            expect(sqlExpression.parameters).toEqual({ p1: Utils.BigNumber.make("10000") });
        });

        it("should compare using greater than equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({
                amount: { from: Utils.BigNumber.make("10000") },
            });

            expect(sqlExpression.query).toEqual("amount >= :p1");
            expect(sqlExpression.parameters).toEqual({ p1: Utils.BigNumber.make("10000") });
        });

        it("should compare using less than equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({
                amount: { to: Utils.BigNumber.make("10000") },
            });

            expect(sqlExpression.query).toEqual("amount <= :p1");
            expect(sqlExpression.parameters).toEqual({ p1: Utils.BigNumber.make("10000") });
        });

        it("should compare using between expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({
                amount: {
                    from: Utils.BigNumber.make("10000"),
                    to: Utils.BigNumber.make("20000"),
                },
            });

            expect(sqlExpression.query).toEqual("amount BETWEEN :p1 AND :p2");
            expect(sqlExpression.parameters).toEqual({
                p1: Utils.BigNumber.make("10000"),
                p2: Utils.BigNumber.make("20000"),
            });
        });
    });

    describe("TransactionCriteria.fee", () => {
        it("should compare using equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({ fee: Utils.BigNumber.make("1000") });

            expect(sqlExpression.query).toEqual("fee = :p1");
            expect(sqlExpression.parameters).toEqual({ p1: Utils.BigNumber.make("1000") });
        });

        it("should compare using greater than equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({
                fee: { from: Utils.BigNumber.make("1000") },
            });

            expect(sqlExpression.query).toEqual("fee >= :p1");
            expect(sqlExpression.parameters).toEqual({ p1: Utils.BigNumber.make("1000") });
        });

        it("should compare using less than equal expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({
                fee: { to: Utils.BigNumber.make("1000") },
            });

            expect(sqlExpression.query).toEqual("fee <= :p1");
            expect(sqlExpression.parameters).toEqual({ p1: Utils.BigNumber.make("1000") });
        });

        it("should compare using between expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({
                fee: {
                    from: Utils.BigNumber.make("1000"),
                    to: Utils.BigNumber.make("2000"),
                },
            });

            expect(sqlExpression.query).toEqual("fee BETWEEN :p1 AND :p2");
            expect(sqlExpression.parameters).toEqual({
                p1: Utils.BigNumber.make("1000"),
                p2: Utils.BigNumber.make("2000"),
            });
        });
    });

    describe("TransactionCriteria.asset", () => {
        it("should compare using contains expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({
                asset: { payment: [{ recipientId: "123" }] },
            });

            expect(sqlExpression.query).toEqual("asset @> :p1");
            expect(sqlExpression.parameters).toEqual({
                p1: { payment: [{ recipientId: "123" }] },
            });
        });
    });

    describe("TransactionCriteria.amount and TransactionCriteria.senderPublicKey", () => {
        it("should join using and expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression({
                amount: { from: Utils.BigNumber.make("10000") },
                senderPublicKey: "123",
            });

            expect(sqlExpression.query).toEqual("(amount >= :p1 AND sender_public_key = :p2)");
            expect(sqlExpression.parameters).toEqual({ p1: Utils.BigNumber.make("10000"), p2: "123" });
        });
    });

    describe("OrTransactionCriteria", () => {
        it("should join using or expression", async () => {
            const sqlExpression = await getCriteriaSqlExpression([
                { amount: { from: Utils.BigNumber.make("10000") }, senderPublicKey: "123" },
                { amount: { from: Utils.BigNumber.make("30000") }, senderPublicKey: "456" },
            ]);

            expect(sqlExpression.query).toEqual(
                "((amount >= :p1 AND sender_public_key = :p2) OR (amount >= :p3 AND sender_public_key = :p4))",
            );
            expect(sqlExpression.parameters).toEqual({
                p1: Utils.BigNumber.make("10000"),
                p2: "123",
                p3: Utils.BigNumber.make("30000"),
                p4: "456",
            });
        });
    });
});
