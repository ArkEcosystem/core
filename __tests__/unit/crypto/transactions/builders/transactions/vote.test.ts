import "jest-extended";

import { CryptoManager, Interfaces, Transactions } from "@arkecosystem/crypto/src";
import * as Generators from "@packages/core-test-framework/src/app/generators";
import { TransactionType } from "@packages/crypto/src/enums";
import { VoteBuilder } from "@packages/crypto/src/transactions/builders/transactions/vote";
import { Two } from "@packages/crypto/src/transactions/types";

import { constructIdentity } from "../../__support__/identitity";

let crypto: CryptoManager<any>;
let builder: VoteBuilder<any, Interfaces.ITransactionData, any>;
let transactionsManager: Transactions.TransactionsManager<any, Interfaces.ITransactionData, any>;
let identity;

beforeEach(() => {
    crypto = CryptoManager.createFromConfig(Generators.generateCryptoConfigRaw());

    transactionsManager = new Transactions.TransactionsManager(crypto, {
        extendTransaction: () => {},
        // @ts-ignore
        validate: (_, data) => ({
            value: data,
        }),
    });

    builder = transactionsManager.BuilderFactory.vote();

    identity = constructIdentity("this is a top secret passphrase", crypto);
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

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.Vote);
        expect(builder).toHaveProperty("data.fee", Two.VoteTransaction.staticFee(crypto));
        expect(builder).toHaveProperty("data.amount", crypto.LibraryManager.Libraries.BigNumber.make(0));
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
            jest.spyOn(crypto.Identities.Keys, "fromPassphrase").mockReturnValueOnce(identity.keys);

            builder.sign(identity.bip39);

            expect(builder.data.recipientId).toBe(identity.address);
        });
    });

    describe("signWithWif", () => {
        it("establishes the recipient id", () => {
            jest.spyOn(crypto.Identities.Keys, "fromWIF").mockReturnValueOnce(identity.keys);

            builder.signWithWif(identity.wif);
            expect(builder.data.recipientId).toBe(identity.address);
        });
    });
});
