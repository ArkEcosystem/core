import { Container } from "@arkecosystem/core-kernel";
import { Enums, Utils } from "@arkecosystem/crypto";

import { TransactionFilter } from "../../../packages/core-database/src/transaction-filter";

const walletRepository = {
    findByAddress: jest.fn(),
};

const container = new Container.Container();
container.bind(Container.Identifiers.WalletRepository).toConstantValue(walletRepository);

beforeEach(() => {
    walletRepository.findByAddress.mockReset();
});

describe("TransactionFilter.getExpression", () => {
    describe("TransactionCriteria.unknown", () => {
        it("should return true expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ unknown: "123" } as any);

            expect(expression).toEqual({ op: "true" });
        });
    });

    describe("TransactionCriteria.address", () => {
        it("should compare senderPublicKey, recipientId, multipayment recipientId, delegate registration sender", async () => {
            walletRepository.findByAddress
                .mockReturnValueOnce({ publicKey: "456" })
                .mockReturnValueOnce({ publicKey: "456" });

            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ address: "123" });

            expect(walletRepository.findByAddress).toBeCalledWith("123");
            expect(expression).toEqual({
                op: "or",
                expressions: [
                    { property: "senderPublicKey", op: "equal", value: "456" },
                    { property: "recipientId", op: "equal", value: "123" },
                    {
                        op: "and",
                        expressions: [
                            { property: "typeGroup", op: "equal", value: Enums.TransactionTypeGroup.Core },
                            { property: "type", op: "equal", value: Enums.TransactionType.MultiPayment },
                            { property: "asset", op: "contains", value: { payment: [{ recipientId: "123" }] } },
                        ],
                    },
                    {
                        op: "and",
                        expressions: [
                            { property: "typeGroup", op: "equal", value: Enums.TransactionTypeGroup.Core },
                            { property: "type", op: "equal", value: Enums.TransactionType.DelegateRegistration },
                            { property: "senderPublicKey", op: "equal", value: "456" },
                        ],
                    },
                ],
            });
        });

        it("should compare recipientId, multipayment recipientId when wallet not found", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ address: "123" });

            expect(walletRepository.findByAddress).toBeCalledWith("123");
            expect(expression).toEqual({
                op: "or",
                expressions: [
                    { property: "recipientId", op: "equal", value: "123" },
                    {
                        op: "and",
                        expressions: [
                            { property: "typeGroup", op: "equal", value: Enums.TransactionTypeGroup.Core },
                            { property: "type", op: "equal", value: Enums.TransactionType.MultiPayment },
                            { property: "asset", op: "contains", value: { payment: [{ recipientId: "123" }] } },
                        ],
                    },
                ],
            });
        });
    });

    describe("TransactionCriteria.senderId", () => {
        it("should compare senderPublicKey using equal expression", async () => {
            walletRepository.findByAddress.mockReturnValueOnce({
                publicKey: "456",
            });

            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ senderId: "123" });

            expect(walletRepository.findByAddress).toBeCalledWith("123");
            expect(expression).toEqual({ property: "senderPublicKey", op: "equal", value: "456" });
        });

        it("should produce false expression when wallet not found", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ senderId: "123" });

            expect(walletRepository.findByAddress).toBeCalledWith("123");
            expect(expression).toEqual({ op: "false" });
        });
    });

    describe("TransactionCriteria.recipientId", () => {
        it("should compare using equal expression and include multipayment and include delegate registration transaction", async () => {
            walletRepository.findByAddress.mockReturnValueOnce({
                publicKey: "456",
            });

            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ recipientId: "123" });

            expect(walletRepository.findByAddress).toBeCalledWith("123");
            expect(expression).toEqual({
                op: "or",
                expressions: [
                    { property: "recipientId", op: "equal", value: "123" },
                    {
                        op: "and",
                        expressions: [
                            { property: "typeGroup", op: "equal", value: Enums.TransactionTypeGroup.Core },
                            { property: "type", op: "equal", value: Enums.TransactionType.MultiPayment },
                            { property: "asset", op: "contains", value: { payment: [{ recipientId: "123" }] } },
                        ],
                    },
                    {
                        op: "and",
                        expressions: [
                            { property: "typeGroup", op: "equal", value: Enums.TransactionTypeGroup.Core },
                            { property: "type", op: "equal", value: Enums.TransactionType.DelegateRegistration },
                            { property: "senderPublicKey", op: "equal", value: "456" },
                        ],
                    },
                ],
            });
        });

        it("should compare using equal expression and include multipayment when wallet not found", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ recipientId: "123" });

            expect(walletRepository.findByAddress).toBeCalledWith("123");
            expect(expression).toEqual({
                op: "or",
                expressions: [
                    { property: "recipientId", op: "equal", value: "123" },
                    {
                        op: "and",
                        expressions: [
                            { property: "typeGroup", op: "equal", value: Enums.TransactionTypeGroup.Core },
                            { property: "type", op: "equal", value: Enums.TransactionType.MultiPayment },
                            { property: "asset", op: "contains", value: { payment: [{ recipientId: "123" }] } },
                        ],
                    },
                ],
            });
        });
    });

    describe("TransactionCriteria.id", () => {
        it("should compare using equal expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ id: "123" });

            expect(expression).toEqual({ property: "id", op: "equal", value: "123" });
        });
    });

    describe("TransactionCriteria.version", () => {
        it("should compare using equal expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ version: 2 });

            expect(expression).toEqual({ property: "version", op: "equal", value: 2 });
        });
    });

    describe("TransactionCriteria.blockId", () => {
        it("should compare using equal expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ blockId: "123" });

            expect(expression).toEqual({ property: "blockId", op: "equal", value: "123" });
        });
    });

    describe("TransactionCriteria.sequence", () => {
        it("should compare using equal expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ sequence: 5 });

            expect(expression).toEqual({ property: "sequence", op: "equal", value: 5 });
        });

        it("should compare using between expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ sequence: { from: 5, to: 10 } });

            expect(expression).toEqual({ property: "sequence", op: "between", from: 5, to: 10 });
        });

        it("should compare using greater than equal expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ sequence: { from: 5 } });

            expect(expression).toEqual({ property: "sequence", op: "greaterThanEqual", value: 5 });
        });

        it("should compare using less than equal expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ sequence: { to: 5 } });

            expect(expression).toEqual({ property: "sequence", op: "lessThanEqual", value: 5 });
        });
    });

    describe("TransactionCriteria.timestamp", () => {
        it("should compare using equal expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ timestamp: 3600 });

            expect(expression).toEqual({ property: "timestamp", op: "equal", value: 3600 });
        });

        it("should compare using between expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ timestamp: { from: 3600, to: 7200 } });

            expect(expression).toEqual({ property: "timestamp", op: "between", from: 3600, to: 7200 });
        });

        it("should compare using greater than equal expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ timestamp: { from: 3600 } });

            expect(expression).toEqual({ property: "timestamp", op: "greaterThanEqual", value: 3600 });
        });

        it("should compare using less than equal expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ timestamp: { to: 3600 } });

            expect(expression).toEqual({ property: "timestamp", op: "lessThanEqual", value: 3600 });
        });
    });

    describe("TransactionCriteria.nonce", () => {
        it("should compare using equal expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ nonce: Utils.BigNumber.make("5") });

            expect(expression).toEqual({ property: "nonce", op: "equal", value: Utils.BigNumber.make("5") });
        });

        it("should compare using between expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({
                nonce: {
                    from: Utils.BigNumber.make("5"),
                    to: Utils.BigNumber.make("10"),
                },
            });

            expect(expression).toEqual({
                property: "nonce",
                op: "between",
                from: Utils.BigNumber.make("5"),
                to: Utils.BigNumber.make("10"),
            });
        });

        it("should compare using greater than equal expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({
                nonce: {
                    from: Utils.BigNumber.make("5"),
                },
            });

            expect(expression).toEqual({
                property: "nonce",
                op: "greaterThanEqual",
                value: Utils.BigNumber.make("5"),
            });
        });

        it("should compare using less than equal expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({
                nonce: {
                    to: Utils.BigNumber.make("5"),
                },
            });

            expect(expression).toEqual({
                property: "nonce",
                op: "lessThanEqual",
                value: Utils.BigNumber.make("5"),
            });
        });
    });

    describe("TransactionCriteria.senderPublicKey", () => {
        it("should compare using equal expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ senderPublicKey: "123" });

            expect(expression).toEqual({ property: "senderPublicKey", op: "equal", value: "123" });
        });
    });

    describe("TransactionCriteria.type", () => {
        it("should compare using equal expression and add core type group expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ type: Enums.TransactionType.Vote });

            expect(expression).toEqual({
                op: "and",
                expressions: [
                    { property: "type", op: "equal", value: Enums.TransactionType.Vote },
                    { property: "typeGroup", op: "equal", value: Enums.TransactionTypeGroup.Core },
                ],
            });
        });

        it("should compare using equal expression and use existing type group expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({
                type: Enums.TransactionType.Vote,
                typeGroup: Enums.TransactionTypeGroup.Test,
            });

            expect(expression).toEqual({
                op: "and",
                expressions: [
                    { property: "type", op: "equal", value: Enums.TransactionType.Vote },
                    { property: "typeGroup", op: "equal", value: Enums.TransactionTypeGroup.Test },
                ],
            });
        });
    });

    describe("TransactionCriteria.typeGroup", () => {
        it("should compare using equal expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ typeGroup: Enums.TransactionTypeGroup.Core });

            expect(expression).toEqual({
                property: "typeGroup",
                op: "equal",
                value: Enums.TransactionTypeGroup.Core,
            });
        });
    });

    describe("TransactionCriteria.vendorField", () => {
        it("should compare using like expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ vendorField: "%pattern%" });

            expect(expression).toEqual({
                property: "vendorField",
                op: "like",
                pattern: "%pattern%",
            });
        });
    });

    describe("TransactionCriteria.amount", () => {
        it("should compare using equal expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ amount: Utils.BigNumber.make("5000") });

            expect(expression).toEqual({ property: "amount", op: "equal", value: Utils.BigNumber.make("5000") });
        });

        it("should compare using between expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({
                amount: {
                    from: Utils.BigNumber.make("5000"),
                    to: Utils.BigNumber.make("10000"),
                },
            });

            expect(expression).toEqual({
                property: "amount",
                op: "between",
                from: Utils.BigNumber.make("5000"),
                to: Utils.BigNumber.make("10000"),
            });
        });

        it("should compare using greater than equal expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({
                amount: {
                    from: Utils.BigNumber.make("5000"),
                },
            });

            expect(expression).toEqual({
                property: "amount",
                op: "greaterThanEqual",
                value: Utils.BigNumber.make("5000"),
            });
        });

        it("should compare using less than equal expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({
                amount: {
                    to: Utils.BigNumber.make("5000"),
                },
            });

            expect(expression).toEqual({
                property: "amount",
                op: "lessThanEqual",
                value: Utils.BigNumber.make("5000"),
            });
        });
    });

    describe("TransactionCriteria.fee", () => {
        it("should compare using equal expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({ fee: Utils.BigNumber.make("500") });

            expect(expression).toEqual({ property: "fee", op: "equal", value: Utils.BigNumber.make("500") });
        });

        it("should compare using between expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({
                fee: {
                    from: Utils.BigNumber.make("500"),
                    to: Utils.BigNumber.make("1000"),
                },
            });

            expect(expression).toEqual({
                property: "fee",
                op: "between",
                from: Utils.BigNumber.make("500"),
                to: Utils.BigNumber.make("1000"),
            });
        });

        it("should compare using greater than equal expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({
                fee: {
                    from: Utils.BigNumber.make("500"),
                },
            });

            expect(expression).toEqual({
                property: "fee",
                op: "greaterThanEqual",
                value: Utils.BigNumber.make("500"),
            });
        });

        it("should compare using less than equal expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({
                fee: {
                    to: Utils.BigNumber.make("500"),
                },
            });

            expect(expression).toEqual({
                property: "fee",
                op: "lessThanEqual",
                value: Utils.BigNumber.make("500"),
            });
        });
    });

    describe("TransactionCriteria.asset", () => {
        it("should compare using contains expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({
                asset: { payment: [{ recipientId: "123" }] },
            });

            expect(expression).toEqual({
                property: "asset",
                op: "contains",
                value: { payment: [{ recipientId: "123" }] },
            });
        });
    });

    describe("TransactionCriteria.amount and TransactionCriteria.senderPublicKey", () => {
        it("should join using and expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression({
                amount: { from: Utils.BigNumber.make("10000") },
                senderPublicKey: "123",
            });

            expect(expression).toEqual({
                op: "and",
                expressions: [
                    { property: "amount", op: "greaterThanEqual", value: Utils.BigNumber.make("10000") },
                    { property: "senderPublicKey", op: "equal", value: "123" },
                ],
            });
        });
    });

    describe("OrTransactionCriteria", () => {
        it("should join using or expression", async () => {
            const transactionFilter = container.resolve(TransactionFilter);
            const expression = await transactionFilter.getExpression([
                { amount: { from: Utils.BigNumber.make("10000") }, senderPublicKey: "123" },
                { amount: { from: Utils.BigNumber.make("30000") }, senderPublicKey: "456" },
            ]);

            expect(expression).toEqual({
                op: "or",
                expressions: [
                    {
                        op: "and",
                        expressions: [
                            { property: "amount", op: "greaterThanEqual", value: Utils.BigNumber.make("10000") },
                            { property: "senderPublicKey", op: "equal", value: "123" },
                        ],
                    },
                    {
                        op: "and",
                        expressions: [
                            { property: "amount", op: "greaterThanEqual", value: Utils.BigNumber.make("30000") },
                            { property: "senderPublicKey", op: "equal", value: "456" },
                        ],
                    },
                ],
            });
        });
    });
});
