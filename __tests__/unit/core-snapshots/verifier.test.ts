import "jest-extended";

import { Verifier } from "@arkecosystem/core-snapshots/src/verifier";
import { Assets } from "./__fixtures__";

describe("Verifier", () => {
    describe("verifyBlock", () => {
        it("should pass", async () => {
            Verifier.verifyBlock(Assets.blocksBigNumber[0], undefined);
        });

        it("should be true if chained", async () => {
            let firstBlock = {...Assets.blocksBigNumber[0]};
            let secondBlock = {...Assets.blocksBigNumber[1]};

            firstBlock.id = secondBlock.previousBlock; // Genesis block fix

            Verifier.verifyBlock(secondBlock, firstBlock)
        });

        it("should throw if block is not chained", async () => {
            let firstBlock = {...Assets.blocksBigNumber[0]};
            let secondBlock = {...Assets.blocksBigNumber[1]};

            firstBlock.id = "123";

            expect(() => { Verifier.verifyBlock(secondBlock, firstBlock)}).toThrow();
        });

        it("should throw", async () => {
            let block = {...Assets.blocksBigNumber[0]};

            block.payloadLength = 123;

            expect(() => { Verifier.verifyBlock(block, undefined)}).toThrow();
        });
    });

    describe("verifyTransaction", () => {
        it("should be ok", async () => {
            Verifier.verifyTransaction(Assets.transactions[0])
        });

        it("should throw", async () => {
            let transaction = {...Assets.transactions[0]};

            transaction.timestamp = 100;
            transaction.serialized = Buffer.from("123123");

            expect(() => {Verifier.verifyTransaction(transaction)}).toThrow();
        });
    });

    describe("verifyRound", () => {
        it("should be ok", async () => {
            Verifier.verifyRound(Assets.rounds[0])
        });

        it("should throw", async () => {
            let round = {...Assets.rounds[0]};

            round.publicKey = "123123"

            expect(() => {Verifier.verifyRound(round)}).toThrow();
        });
    });
});
