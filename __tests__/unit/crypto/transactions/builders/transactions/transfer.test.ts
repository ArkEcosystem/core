import "jest-extended";

import { configManager } from "../../../../../../packages/crypto/src/managers";

configManager.setFromPreset("testnet");

import { Utils } from "@arkecosystem/crypto";
import { TransactionType } from "../../../../../../packages/crypto/src/enums";
import { VendorFieldLengthExceededError } from "../../../../../../packages/crypto/src/errors";
import { Keys, WIF } from "../../../../../../packages/crypto/src/identities";
import { devnet } from "../../../../../../packages/crypto/src/networks";
import { BuilderFactory, TransferTransaction } from "../../../../../../packages/crypto/src/transactions";
import { TransferBuilder } from "../../../../../../packages/crypto/src/transactions/builders/transactions/transfer";
import { identity } from "../../../../../utils/identities";
import { transactionBuilder } from "./__shared__/transaction-builder";

let builder: TransferBuilder;

beforeEach(() => {
    builder = BuilderFactory.transfer();
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
            const network = 23;
            const keys = Keys.fromPassphrase(passphrase);
            const wif = WIF.fromKeys(keys, devnet.network);

            const wifTransaction = builder
                .recipientId(identity.address)
                .amount("10")
                .fee("10")
                .network(network);

            const passphraseTransaction = BuilderFactory.transfer();
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
            const keys = Keys.fromPassphrase(secondPassphrase);
            const wif = WIF.fromKeys(keys, devnet.network);

            const wifTransaction = builder
                .recipientId(identity.address)
                .amount("10")
                .fee("10")
                .network(network)
                .sign(passphrase);

            const passphraseTransaction = BuilderFactory.transfer();
            passphraseTransaction.data = { ...wifTransaction.data };

            wifTransaction.secondSignWithWif(wif, 170);
            passphraseTransaction.secondSign(secondPassphrase);

            expect(wifTransaction.data.secondSignature).toBe(passphraseTransaction.data.secondSignature);
        });
    });

    transactionBuilder(() => builder);

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.Transfer);
        expect(builder).toHaveProperty("data.fee", TransferTransaction.staticFee());
        expect(builder).toHaveProperty("data.amount", Utils.BigNumber.make(0));
        expect(builder).toHaveProperty("data.recipientId", undefined);
        expect(builder).toHaveProperty("data.senderPublicKey", undefined);
        expect(builder).toHaveProperty("data.expiration", 0);
    });

    describe("vendorField", () => {
        it("should set the vendorField", () => {
            builder.vendorField("fake");
            expect(builder.data.vendorField).toBe("fake");
        });

        it("should throw an error because the vendorField value exceeds the allowed maximum length", () => {
            expect(() => builder.vendorField("a".repeat(65))).toThrowError(VendorFieldLengthExceededError);
        });
    });
});
