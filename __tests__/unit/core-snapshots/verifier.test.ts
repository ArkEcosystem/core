import "jest-extended";

import { Verifier } from "@arkecosystem/core-snapshots/src/verifier";
import { Crypto, Transactions } from "@arkecosystem/crypto";

import { Assets } from "./__fixtures__";

afterEach(() => {
    jest.clearAllMocks();
});

describe("Verifier", () => {
    describe("verifyBlock", () => {
        it("should pass", async () => {
            Verifier.verifyBlock(Assets.blocksBigNumber[0], undefined);
        });

        it("should be true if chained", async () => {
            const firstBlock = { ...Assets.blocksBigNumber[0] };
            const secondBlock = { ...Assets.blocksBigNumber[1] };

            firstBlock.id = secondBlock.previousBlock; // Genesis block fix

            Verifier.verifyBlock(secondBlock, firstBlock);
        });

        it("should throw if block is not chained", async () => {
            const firstBlock = { ...Assets.blocksBigNumber[0] };
            const secondBlock = { ...Assets.blocksBigNumber[1] };

            firstBlock.id = "123";

            expect(() => {
                Verifier.verifyBlock(secondBlock, firstBlock);
            }).toThrow();
        });

        it("should throw", async () => {
            const block = { ...Assets.blocksBigNumber[0] };

            block.payloadLength = 123;

            expect(() => {
                Verifier.verifyBlock(block, undefined);
            }).toThrow();
        });

        it("should throw if verifyECDSA throws error", async () => {
            Crypto.Hash.verifyECDSA = jest.fn().mockImplementation(() => {
                throw new Error();
            });

            const block = { ...Assets.blocksBigNumber[0] };

            expect(() => {
                Verifier.verifyBlock(block, undefined);
            }).toThrow();
        });
    });

    describe("verifyTransaction", () => {
        it("should be ok", async () => {
            Verifier.verifyTransaction(Assets.transactions[0]);
        });

        it("should pass if transaction is  signed with multisignature", async () => {
            Transactions.TransactionFactory.fromBytes = jest
                .fn()
                .mockReturnValue({ isVerified: true, data: { signatures: [] } });
            const transaction = { ...Assets.transactions[0] };

            transaction.timestamp = 100;

            Verifier.verifyTransaction(transaction);
        });

        it("should pass if transaction is valid", async () => {
            Transactions.TransactionFactory.fromBytes = jest.fn().mockReturnValue({ isVerified: true, data: {} });
            const transaction = { ...Assets.transactions[0] };

            transaction.timestamp = 100;

            Verifier.verifyTransaction(transaction);
        });

        it("should throw if transaction is not valid", async () => {
            Transactions.TransactionFactory.fromBytes = jest.fn().mockReturnValue({ isVerified: false, data: {} });
            const transaction = { ...Assets.transactions[0] };

            transaction.timestamp = 100;

            expect(() => {
                Verifier.verifyTransaction(transaction);
            }).toThrow();
        });

        it("should throw if fromBytes throws error", async () => {
            Transactions.TransactionFactory.fromBytes = jest.fn().mockImplementation(() => {
                throw new Error();
            });

            const transaction = { ...Assets.transactions[0] };

            transaction.timestamp = 100;

            expect(() => {
                Verifier.verifyTransaction(transaction);
            }).toThrow();
        });
    });

    describe("verifyRound", () => {
        it("should be ok", async () => {
            Verifier.verifyRound(Assets.rounds[0]);
        });

        it("should throw", async () => {
            const round = { ...Assets.rounds[0] };

            round.publicKey = "123123";

            expect(() => {
                Verifier.verifyRound(round);
            }).toThrow();
        });
    });
});
