import { Slots } from "../../../../../../../packages/crypto/src/crypto";
import { Keys } from "../../../../../../../packages/crypto/src/identities";
import { Transaction } from "../../../../../../../packages/crypto/src/transactions";
import { TransactionBuilder } from "../../../../../../../packages/crypto/src/transactions/builders/transactions/transaction";
import * as Utils from "../../../../../../../packages/crypto/src/utils";
import { identity, identitySecond } from "../../../../../../utils/identities";

export const transactionBuilder = <T extends TransactionBuilder<T>>(provider: () => TransactionBuilder<T>) => {
    describe("TransactionBuilder", () => {
        describe("inherits = require(TransactionBuilder", () => {
            it("should have the essential properties", () => {
                const builder = provider();

                expect(builder).toHaveProperty("data.id", undefined);
                expect(builder).toHaveProperty("data.timestamp");
                expect(builder).toHaveProperty("data.version", 0x01);

                expect(builder).toHaveProperty("data.type");
                expect(builder).toHaveProperty("data.fee");
            });

            describe("builder", () => {
                let timestamp;
                let data;

                beforeEach(() => {
                    timestamp = Slots.getTime();

                    data = {
                        id: "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8dae1a1f",
                        amount: Utils.BigNumber.ONE,
                        fee: Utils.BigNumber.ONE,
                        recipientId: "DK2v39r3hD9Lw8R5fFFHjUyCtXm1VETi42",
                        senderPublicKey: "035440a82cb44faef75c3d7d881696530aac4d50da314b91795740cdbeaba9113c",
                        timestamp,
                        type: 0,
                        version: 0x01,
                    };
                });

                it("should return a Transaction model with the builder data", () => {
                    const builder = provider();

                    builder.data = data;

                    const transaction = builder.build();

                    expect(transaction.type).toBe(0);
                    expect(transaction.data.amount).toEqual(Utils.BigNumber.ONE);
                    expect(transaction.data.fee).toEqual(Utils.BigNumber.ONE);
                    expect(transaction.data.recipientId).toBe("DK2v39r3hD9Lw8R5fFFHjUyCtXm1VETi42");
                    expect(transaction.data.senderPublicKey).toBe(
                        "035440a82cb44faef75c3d7d881696530aac4d50da314b91795740cdbeaba9113c",
                    );
                    expect(transaction.data.timestamp).toBe(timestamp);
                    expect(transaction.data.version).toBe(0x01);
                });

                it("could merge and override the builder data", () => {
                    const builder = provider();

                    builder.data = data;

                    const transaction = builder.build({
                        amount: Utils.BigNumber.make(33),
                        fee: Utils.BigNumber.make(1000),
                    });

                    expect(transaction.data.amount).toEqual(Utils.BigNumber.make(33));
                    expect(transaction.data.fee).toEqual(Utils.BigNumber.make(1000));
                    expect(transaction.data.recipientId).toBe("DK2v39r3hD9Lw8R5fFFHjUyCtXm1VETi42");
                    expect(transaction.data.senderPublicKey).toBe(
                        "035440a82cb44faef75c3d7d881696530aac4d50da314b91795740cdbeaba9113c",
                    );
                    expect(transaction.data.timestamp).toBe(timestamp);
                    expect(transaction.data.version).toBe(0x01);
                });
            });

            describe("fee", () => {
                it("should set the fee", () => {
                    const builder = provider();

                    builder.fee("255");
                    expect(builder.data.fee).toEqual(Utils.BigNumber.make(255));
                });
            });

            describe("amount", () => {
                it("should set the amount", () => {
                    const builder = provider();

                    builder.amount("255");
                    expect(builder.data.amount).toEqual(Utils.BigNumber.make(255));
                });
            });

            describe("recipientId", () => {
                it("should set the recipient id", () => {
                    const builder = provider();

                    builder.recipientId("fake");
                    expect(builder.data.recipientId).toBe("fake");
                });
            });

            describe("senderPublicKey", () => {
                it("should set the sender public key", () => {
                    const builder = provider();

                    builder.senderPublicKey("fake");
                    expect(builder.data.senderPublicKey).toBe("fake");
                });
            });
        });

        describe("sign", () => {
            it("signs this transaction with the keys of the passphrase", () => {
                const builder = provider();

                const spyKeys = jest.spyOn(Keys, "fromPassphrase").mockReturnValueOnce(identity.keys);
                const spySign = jest.spyOn(Transaction, "sign").mockImplementationOnce(jest.fn());

                builder.sign(identity.bip39);

                expect(spyKeys).toHaveBeenCalledWith(identity.bip39);
                expect(spySign).toHaveBeenCalledWith((builder as any).getSigningObject(), identity.keys);
            });

            it("establishes the public key of the sender", () => {
                const spySign = jest.spyOn(Transaction, "sign").mockImplementationOnce(jest.fn());

                const builder = provider();
                builder.sign(identity.bip39);

                expect(builder.data.senderPublicKey).toBe(identity.keys.publicKey);
                expect(spySign).toHaveBeenCalledWith((builder as any).getSigningObject(), identity.keys);
            });
        });

        describe("signWithWif", () => {
            it("signs this transaction with keys from a wif", () => {
                const spyKeys = jest.spyOn(Keys, "fromWIF").mockReturnValueOnce(identity.keys);
                const spySign = jest.spyOn(Transaction, "sign").mockImplementationOnce(jest.fn());

                const builder = provider();
                builder.network(23).signWithWif(identity.bip39);

                expect(spyKeys).toHaveBeenCalledWith(identity.bip39, {
                    wif: 170,
                });
                expect(spySign).toHaveBeenCalledWith((builder as any).getSigningObject(), identity.keys);
            });

            it("establishes the public key of the sender", () => {
                const spySign = jest.spyOn(Transaction, "sign").mockImplementationOnce(jest.fn());

                const builder = provider();
                builder.signWithWif(identity.wif);

                expect(builder.data.senderPublicKey).toBe(identity.publicKey);
                expect(spySign).toHaveBeenCalledWith((builder as any).getSigningObject(), identity.keys);
            });
        });

        describe("secondSign", () => {
            it("signs this transaction with the keys of the second passphrase", () => {
                const builder = provider();

                const spyKeys = jest.spyOn(Keys, "fromPassphrase").mockReturnValueOnce(identitySecond.keys);
                const spySecondSign = jest.spyOn(Transaction, "secondSign").mockImplementationOnce(jest.fn());

                builder.secondSign(identitySecond.bip39);

                expect(spyKeys).toHaveBeenCalledWith(identitySecond.bip39);
                expect(spySecondSign).toHaveBeenCalledWith((builder as any).getSigningObject(), identitySecond.keys);
            });
        });

        describe("secondSignWithWif", () => {
            it("signs this transaction with the keys of a second wif", () => {
                const spyKeys = jest.spyOn(Keys, "fromWIF").mockReturnValueOnce(identitySecond.keys);
                const spySecondSign = jest.spyOn(Transaction, "secondSign").mockImplementationOnce(jest.fn());

                const builder = provider();
                builder.network(23).secondSignWithWif(identitySecond.bip39, undefined);

                expect(spyKeys).toHaveBeenCalledWith(identitySecond.bip39, {
                    wif: 170,
                });
                expect(spySecondSign).toHaveBeenCalledWith((builder as any).getSigningObject(), identitySecond.keys);
            });
        });
    });
};
