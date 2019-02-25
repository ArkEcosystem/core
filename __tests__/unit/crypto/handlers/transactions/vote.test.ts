import "jest-extended";

import { VoteHandler } from "../../../../../packages/crypto/src/handlers/transactions/vote";
import { Bignum } from "../../../../../packages/crypto/src/utils";

const handler = new VoteHandler();

let wallet;
let voteTransaction;
let unvoteTransaction;
let errors;

beforeEach(() => {
    wallet = {
        address: "DQ7VAW7u171hwDW75R1BqfHbA9yiKRCBSh",
        balance: new Bignum("6453530000000"),
        publicKey: "02a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a087",
        vote: null,
    };

    voteTransaction = {
        id: "73cbce62d69308ff7e69f1a7836106a16dc59907198aea4bb80d340232e53041",
        signature:
            "3045022100f53da6eb18ca7954bb7c620ceeaf5cb3433685d173401146aea35ee8e5f5c95002204ea57f573745c8f5c57b256e38397d3e1977bdbfac295128320401c6117bb2f3",
        timestamp: 54833694,
        type: 3,
        fee: new Bignum(100000000),
        senderPublicKey: "02a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a087",
        amount: Bignum.ZERO,
        recipientId: "DLvBAvLePTJ9DfDzby5AAkqPqwCVDCT647",
        asset: {
            votes: ["+02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af"],
        },
    };

    unvoteTransaction = {
        id: "d714bc0443208f9281ad83f9f3d941628b875c84f65a09601148ce87ca879cb9",
        signature:
            "3045022100957106a924eb40df6ff530cff80fede0195c30284fdb5671e736c7d0b57696f6022072b0fd80af235d79701e9aea74ef48366ef9f5aecedbb5d502e6392569c059c8",
        timestamp: 54833718,
        type: 3,
        fee: new Bignum(100000000),
        senderPublicKey: "02a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a087",
        amount: Bignum.ZERO,
        recipientId: "DLvBAvLePTJ9DfDzby5AAkqPqwCVDCT647",
        asset: {
            votes: ["-02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af"],
        },
    };

    errors = [];
});

describe("VoteHandler", () => {
    describe("canApply", () => {
        it("should be true if the vote is valid and the wallet has not voted", () => {
            expect(handler.canApply(wallet, voteTransaction, errors)).toBeTrue();
            expect(errors).toBeEmpty();
        });

        it("should be true if the unvote is valid and the wallet has voted", () => {
            wallet.vote = "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af";

            expect(handler.canApply(wallet, unvoteTransaction, errors)).toBeTrue();
            expect(errors).toBeEmpty();
        });

        it("should be false if wallet has already voted", () => {
            wallet.vote = "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af";

            expect(handler.canApply(wallet, voteTransaction, errors)).toBeFalse();
            expect(errors).toContain("Wallet has already voted");
        });

        it("should be false if the asset public key differs from the currently voted one", () => {
            wallet.vote = "a310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0";

            expect(handler.canApply(wallet, unvoteTransaction, errors)).toBeFalse();
            expect(errors).toContain("The unvote public key does not match the currently voted one");
        });

        it("should be false if unvoting a non-voted wallet", () => {
            expect(handler.canApply(wallet, unvoteTransaction, errors)).toBeFalse();
            expect(errors).toContain("Wallet has not voted yet");
        });

        it("should be false if wallet has insufficient funds", () => {
            wallet.balance = Bignum.ZERO;

            expect(handler.canApply(wallet, voteTransaction, errors)).toBeFalse();
            expect(errors).toContain("Insufficient balance in the wallet");
        });
    });

    describe("apply", () => {
        describe("vote", () => {
            it("should be ok", () => {
                expect(wallet.vote).toBeNull();

                handler.applyTransactionToSender(wallet, voteTransaction);

                expect(wallet.vote).not.toBeNull();
            });

            it("should not be ok", () => {
                wallet.vote = "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af";

                expect(wallet.vote).not.toBeNull();

                handler.applyTransactionToSender(wallet, voteTransaction);

                expect(wallet.vote).not.toBeNull();
            });
        });

        describe("unvote", () => {
            it("should remove the vote from the wallet", () => {
                wallet.vote = "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af";

                expect(wallet.vote).not.toBeNull();

                handler.applyTransactionToSender(wallet, unvoteTransaction);

                expect(wallet.vote).toBeNull();
            });
        });
    });

    describe("revert", () => {
        describe("vote", () => {
            it("should remove the vote from the wallet", () => {
                wallet.vote = "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af";

                expect(wallet.vote).not.toBeNull();

                handler.revertTransactionForSender(wallet, voteTransaction);

                expect(wallet.vote).toBeNull();
            });
        });

        describe("unvote", () => {
            it("should add the vote to the wallet", () => {
                expect(wallet.vote).toBeNull();

                handler.revertTransactionForSender(wallet, unvoteTransaction);

                expect(wallet.vote).toBe("02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af");
            });
        });
    });
});
