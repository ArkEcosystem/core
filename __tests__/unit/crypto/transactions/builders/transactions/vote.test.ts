import "jest-extended";

import { configManager } from "../../../../../../packages/crypto/src/managers";

configManager.setFromPreset("testnet");

import { TransactionType } from "../../../../../../packages/crypto/src/enums";
import { Keys } from "../../../../../../packages/crypto/src/identities";
import { BuilderFactory, VoteTransaction } from "../../../../../../packages/crypto/src/transactions";
import { VoteBuilder } from "../../../../../../packages/crypto/src/transactions/builders/transactions/vote";
import * as Utils from "../../../../../../packages/crypto/src/utils";
import { identity } from "../../../../../utils/identities";
import { transactionBuilder } from "./__shared__/transaction-builder";

let builder: VoteBuilder;

beforeEach(() => {
    builder = BuilderFactory.vote();
});

describe("Vote Transaction", () => {
    describe("verify", () => {
        it("should be valid with a signature", () => {
            const actual = builder
                .votesAsset(["+02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af"])
                .sign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should be valid with a second signature", () => {
            const actual = builder
                .votesAsset(["+02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af"])
                .sign("dummy passphrase")
                .secondSign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });

    transactionBuilder(() => builder);

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.Vote);
        expect(builder).toHaveProperty("data.fee", VoteTransaction.staticFee());
        expect(builder).toHaveProperty("data.amount", Utils.BigNumber.make(0));
        expect(builder).toHaveProperty("data.recipientId", undefined);
        expect(builder).toHaveProperty("data.senderPublicKey", undefined);
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
            jest.spyOn(Keys, "fromWIF").mockReturnValueOnce(identity.keys);

            builder.sign(identity.bip39);
            expect(builder.data.recipientId).toBe(identity.address);
        });
    });

    describe("signWithWif", () => {
        it("establishes the recipient id", () => {
            jest.spyOn(Keys, "fromWIF").mockReturnValueOnce(identity.keys);

            builder.signWithWif(identity.wif);
            expect(builder.data.recipientId).toBe(identity.address);
        });
    });
});
