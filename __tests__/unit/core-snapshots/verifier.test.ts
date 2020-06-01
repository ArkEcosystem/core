import "jest-extended";

import { CryptoSuite } from "@packages/core-crypto";
import { Verifier } from "@packages/core-snapshots/src/verifier";

import { Assets } from "./__fixtures__";

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));

let verifierInstance: Verifier;
beforeEach(() => {
    verifierInstance = new Verifier(crypto.CryptoManager, crypto.TransactionManager, crypto.BlockFactory);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("Verifier", () => {
    describe("verifyBlock", () => {
        it("should pass", async () => {
            verifierInstance.verifyBlock(Assets.blocksBigNumber[0], undefined);
        });

        it("should be true if chained", async () => {
            const firstBlock = { ...Assets.blocksBigNumber[0] };
            const secondBlock = { ...Assets.blocksBigNumber[1] };

            firstBlock.id = secondBlock.previousBlock; // Genesis block fix

            verifierInstance.verifyBlock(secondBlock, firstBlock);
        });

        it("should throw if block is not chained", async () => {
            const firstBlock = { ...Assets.blocksBigNumber[0] };
            const secondBlock = { ...Assets.blocksBigNumber[1] };

            firstBlock.id = "123";

            expect(() => {
                verifierInstance.verifyBlock(secondBlock, firstBlock);
            }).toThrow();
        });

        it("should throw", async () => {
            const block = { ...Assets.blocksBigNumber[0] };

            block.payloadLength = 123;

            expect(() => {
                verifierInstance.verifyBlock(block, undefined);
            }).toThrow();
        });

        it("should throw if verifyECDSA throws error", async () => {
            crypto.CryptoManager.LibraryManager.Crypto.Hash.verifyECDSA = jest.fn().mockImplementation(() => {
                throw new Error();
            });

            const block = { ...Assets.blocksBigNumber[0] };

            expect(() => {
                verifierInstance.verifyBlock(block, undefined);
            }).toThrow();
        });
    });

    describe("verifyTransaction", () => {
        it("should be ok", async () => {
            verifierInstance.verifyTransaction(Assets.transactions[0]);
        });

        it("should throw if transaction is not valid", async () => {
            crypto.TransactionManager.TransactionFactory.fromBytes = jest.fn().mockReturnValue(false);
            const transaction = { ...Assets.transactions[0] };

            transaction.timestamp = 100;

            expect(() => {
                verifierInstance.verifyTransaction(transaction);
            }).toThrow();
        });

        it("should throw if fromBytes throws error", async () => {
            crypto.TransactionManager.TransactionFactory.fromBytes = jest.fn().mockImplementation(() => {
                throw new Error();
            });

            const transaction = { ...Assets.transactions[0] };

            transaction.timestamp = 100;

            expect(() => {
                verifierInstance.verifyTransaction(transaction);
            }).toThrow();
        });
    });

    describe("verifyRound", () => {
        it("should be ok", async () => {
            verifierInstance.verifyRound(Assets.rounds[0]);
        });

        it("should throw", async () => {
            const round = { ...Assets.rounds[0] };

            round.publicKey = "123123";

            expect(() => {
                verifierInstance.verifyRound(round);
            }).toThrow();
        });
    });
});
