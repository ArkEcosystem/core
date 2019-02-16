import "jest-extended";
import { VoteBuilder } from "../../../src/builder/transactions/vote";
import { client } from "../../../src/client";
import { TransactionTypes } from "../../../src/constants";
import { crypto } from "../../../src/crypto";
import { feeManager } from "../../../src/managers/fee";
import { transactionBuilder } from "./__shared__/transaction-builder";

let builder: VoteBuilder;

beforeEach(() => {
    builder = client.getBuilder().vote();
});

describe("Vote Transaction", () => {
    describe("verify", () => {
        it("should be valid with a signature", () => {
            const actual = builder
                .votesAsset(["+02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af"])
                .sign("dummy passphrase");

            expect(actual.build().verify()).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should be valid with a second signature", () => {
            const actual = builder
                .votesAsset(["+02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af"])
                .sign("dummy passphrase")
                .secondSign("dummy passphrase");

            expect(actual.build().verify()).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });

    transactionBuilder(() => builder);

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionTypes.Vote);
        expect(builder).toHaveProperty("data.fee", feeManager.get(TransactionTypes.Vote));
        expect(builder).toHaveProperty("data.amount", 0);
        expect(builder).toHaveProperty("data.recipientId", null);
        expect(builder).toHaveProperty("data.senderPublicKey", null);
        expect(builder).toHaveProperty("data.asset");
        expect(builder).toHaveProperty("data.asset.votes", []);
    });

    describe("votesAsset", () => {
        it("establishes the votes asset", () => {
            const votes = ["+dummy-1"];
            builder.votesAsset(votes);
            expect(builder.data.asset.votes).toBe(votes);
        });
    });

    describe("sign", () => {
        it("establishes the recipient id", () => {
            const pass = "dummy pass";

            // @ts-ignore
            crypto.getKeys = jest.fn(() => ({
                publicKey: "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af",
            }));
            crypto.sign = jest.fn();

            builder.sign(pass);
            expect(builder.data.recipientId).toBe("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F");
        });
    });

    describe("signWithWif", () => {
        it("establishes the recipient id", () => {
            const pass = "dummy pass";

            // @ts-ignore
            crypto.getKeysFromWIF = jest.fn(() => ({
                publicKey: "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af",
            }));
            // builder.signWithWif = jest.fn();

            builder.signWithWif(pass);
            expect(builder.data.recipientId).toBe("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F");
        });
    });
});
