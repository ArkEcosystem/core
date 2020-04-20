import "jest-extended";

import { Verifier } from "@arkecosystem/core-snapshots/src/verifier";
import { Assets } from "./__fixtures__";

describe("Verifier", () => {
    describe("verifyBlock", () => {
        it("should pass", async () => {
            Verifier.verifyBlock(Assets.blocks[0], undefined);
        });

        it("should be true if chained", async () => {
            let firstBlock = {...Assets.blocks[0]};
            let secondBlock = {...Assets.blocks[1]};

            firstBlock.id = secondBlock.previousBlock; // Genesis block fix

            expect(Verifier.verifyBlock(secondBlock, firstBlock)).toResolve();
        });

        it("should be false", async () => {
            let block = {...Assets.blocks[0]};

            block.payloadLength = 123;

            expect(Verifier.verifyBlock(block, undefined)).toThrow();
        });
    });

    describe("verifyTransaction", () => {
        it("should be true", async () => {
            expect(Verifier.verifyTransaction(Assets.transactions[0])).toResolve();
        });

        // it("should be false if not valid length", async () => {
        //     let round = {...Assets.rounds[0]};
        //
        //     round.publicKey = "123123"
        //
        //     expect(Verifier.verifyRound(round)).toBeFalse();
        // });
    });

    describe("verifyRound", () => {
        it("should be true", async () => {
            expect(Verifier.verifyRound(Assets.rounds[0])).toBeTrue();
        });

        it("should be false if not valid length", async () => {
            let round = {...Assets.rounds[0]};

            round.publicKey = "123123"

            expect(Verifier.verifyRound(round)).toBeFalse();
        });
    });
});
