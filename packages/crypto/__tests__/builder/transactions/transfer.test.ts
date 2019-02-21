import "jest-extended";
import { TransferBuilder } from "../../../src/builder/transactions/transfer";
import { client } from "../../../src/client";
import { TransactionTypes } from "../../../src/constants";
import { crypto } from "../../../src/crypto";
import { feeManager } from "../../../src/managers/fee";
import { transactionBuilder } from "./__shared__/transaction-builder";

let builder: TransferBuilder;

beforeEach(() => {
    builder = client.getBuilder().transfer();
});

describe("Transfer Transaction", () => {
    describe("verify", () => {
        it("should be valid with a signature", () => {
            const actual = builder
                .recipientId("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F")
                .amount(1)
                .vendorField("dummy")
                .sign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should be valid with a second signature", () => {
            const actual = builder
                .recipientId("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F")
                .amount(1)
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
            const network = 23;
            const keys = crypto.getKeys(passphrase);
            const wif = crypto.keysToWIF(keys, { wif: 170 });

            const wifTransaction = builder
                .amount(10)
                .fee(10)
                .network(network);

            const passphraseTransaction = client.getBuilder().transfer();
            passphraseTransaction.data = { ...wifTransaction.data };

            wifTransaction.signWithWif(wif, 170);
            passphraseTransaction.sign(passphrase);

            expect(wifTransaction.data.signature).toBe(passphraseTransaction.data.signature);
        });
    });

    describe("secondSignWithWif", () => {
        it("should sign a transaction and match signed with a passphrase", () => {
            const passphrase = "first passphrase";
            const secondPassphrase = "second passphrase";
            const network = 23;
            const keys = crypto.getKeys(secondPassphrase);
            const wif = crypto.keysToWIF(keys, { wif: 170 });

            const wifTransaction = builder
                .amount(10)
                .fee(10)
                .network(network)
                .sign(passphrase);

            const passphraseTransaction = client.getBuilder().transfer();
            passphraseTransaction.data = { ...wifTransaction.data };

            wifTransaction.secondSignWithWif(wif, 170);
            passphraseTransaction.secondSign(secondPassphrase);

            expect(wifTransaction.data.secondSignature).toBe(passphraseTransaction.data.secondSignature);
        });
    });

    transactionBuilder(() => builder);

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionTypes.Transfer);
        expect(builder).toHaveProperty("data.fee", feeManager.get(TransactionTypes.Transfer));
        expect(builder).toHaveProperty("data.amount", 0);
        expect(builder).toHaveProperty("data.recipientId", null);
        expect(builder).toHaveProperty("data.senderPublicKey", null);
        expect(builder).toHaveProperty("data.expiration", 0);
    });

    describe("vendorField", () => {
        it("should set the vendorField", () => {
            builder.vendorField("fake");
            expect(builder.data.vendorField).toBe("fake");
        });
    });
});
