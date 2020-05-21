import "jest-extended";

import { CryptoManager, Interfaces, Transactions } from "@arkecosystem/crypto/src";
import * as Generators from "@packages/core-test-framework/src/app/generators";
import { TransactionType } from "@packages/crypto/src/enums";
import { TransferBuilder } from "@packages/crypto/src/transactions/builders/transactions/transfer";
import { Two } from "@packages/crypto/src/transactions/types";

import { constructIdentity } from "../../__support__/identitity";

let crypto: CryptoManager<any>;
let builder: TransferBuilder<any, Interfaces.ITransactionData, any>;
let transactionsManager: Transactions.TransactionManager<any, Interfaces.ITransactionData, any>;
let identity;

beforeEach(() => {
    crypto = CryptoManager.createFromConfig(Generators.generateCryptoConfigRaw());

    transactionsManager = new Transactions.TransactionManager(crypto, {
        extendTransaction: () => {},
        // @ts-ignore
        validate: (_, data) => ({
            value: data,
        }),
    });

    builder = transactionsManager.BuilderFactory.transfer();

    identity = constructIdentity("this is a top secret passphrase", crypto);
});

describe("Transfer Transaction", () => {
    describe("verify", () => {
        it("should be valid with a signature", () => {
            const actual = builder
                .recipientId(identity.address)
                .amount("1")
                .vendorField("dummy")
                .sign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should be valid with a second signature", () => {
            const actual = builder
                .recipientId(identity.address)
                .amount("1")
                .vendorField("dummy")
                .sign("dummy passphrase")
                .secondSign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });

    describe("signWithWif", () => {
        it("should sign a transaction and match signed with a passphrase", () => {
            const passphrase = "sample passphrase";
            const keys = crypto.Identities.Keys.fromPassphrase(passphrase);
            const wif = crypto.Identities.Wif.fromKeys(keys);

            const wifTransaction = builder.recipientId(identity.address).amount("10").fee("10");

            const passphraseTransaction = transactionsManager.BuilderFactory.transfer();
            passphraseTransaction.data = { ...wifTransaction.data };

            wifTransaction.signWithWif(wif);
            passphraseTransaction.sign(passphrase);

            expect(wifTransaction.data.signature).toBe(passphraseTransaction.data.signature);
        });
    });

    describe("secondSignWithWif", () => {
        it("should sign a transaction and match signed with a passphrase", () => {
            const passphrase = "first passphrase";
            const secondPassphrase = "second passphrase";
            const keys = crypto.Identities.Keys.fromPassphrase(secondPassphrase);
            const wif = crypto.Identities.Wif.fromKeys(keys);

            const wifTransaction = builder.recipientId(identity.address).amount("10").fee("10").sign(passphrase);

            const passphraseTransaction = transactionsManager.BuilderFactory.transfer();
            passphraseTransaction.data = { ...wifTransaction.data };

            wifTransaction.secondSignWithWif(wif);
            passphraseTransaction.secondSign(secondPassphrase);

            expect(wifTransaction.data.secondSignature).toBe(passphraseTransaction.data.secondSignature);
        });
    });

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.Transfer);
        expect(builder).toHaveProperty("data.fee", Two.TransferTransaction.staticFee(crypto));
        expect(builder).toHaveProperty("data.amount", crypto.LibraryManager.Libraries.BigNumber.make(0));
        expect(builder).toHaveProperty("data.recipientId", undefined);
        expect(builder).toHaveProperty("data.senderPublicKey", undefined);
        expect(builder).toHaveProperty("data.expiration", 0);
    });

    describe("vendorField", () => {
        it("should set the vendorField", () => {
            builder.vendorField("fake");
            expect(builder.data.vendorField).toBe("fake");
        });
    });
});
