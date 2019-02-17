import { TransactionBuilder } from "../../../../src/builder/transactions/transaction";
import { crypto, slots } from "../../../../src/crypto";
import { Transaction } from "../../../../src/models/transaction";
import { Bignum } from "../../../../src/utils";

export const transactionBuilder = <T extends TransactionBuilder<T>>(provider: () => TransactionBuilder<T>) => {
    describe("TransactionBuilder", () => {
        describe("inherits = require(TransactionBuilder", () => {
            it("should have the essential properties", () => {
                const builder = provider();

                expect(builder).toHaveProperty("data.id", null);
                expect(builder).toHaveProperty("data.timestamp");
                expect(builder).toHaveProperty("data.version", 0x01);

                expect(builder).toHaveProperty("data.type");
                expect(builder).toHaveProperty("data.fee");
            });

            describe("builder", () => {
                let timestamp;
                let data;

                beforeEach(() => {
                    timestamp = slots.getTime();

                    data = {
                        id: "fake-id",
                        amount: 0,
                        fee: 0,
                        recipientId: "DK2v39r3hD9Lw8R5fFFHjUyCtXm1VETi42",
                        senderPublicKey: "035440a82cb44faef75c3d7d881696530aac4d50da314b91795740cdbeaba9113c",
                        timestamp,
                        type: 0,
                        version: 0x03,
                    };
                });

                it("should return a Transaction model with the builder data", () => {
                    const builder = provider();

                    builder.data = data;

                    const transaction = builder.build();

                    expect(transaction).toBeInstanceOf(Transaction);
                    expect(transaction.amount).toEqual(Bignum.ZERO);
                    expect(transaction.fee).toEqual(Bignum.ZERO);
                    expect(transaction.recipientId).toBe("DK2v39r3hD9Lw8R5fFFHjUyCtXm1VETi42");
                    expect(transaction.senderPublicKey).toBe(
                        "035440a82cb44faef75c3d7d881696530aac4d50da314b91795740cdbeaba9113c",
                    );
                    expect(transaction.timestamp).toBe(timestamp);
                    expect(transaction.type).toBe(0);
                    expect(transaction.version).toBe(0x03);
                });

                it("could merge and override the builder data", () => {
                    const builder = provider();

                    builder.data = data;

                    const transaction = builder.build({
                        amount: 33,
                        fee: 1000,
                    });

                    expect(transaction).toBeInstanceOf(Transaction);
                    expect(transaction.amount).toEqual(new Bignum(33));
                    expect(transaction.fee).toEqual(new Bignum(1000));
                    expect(transaction.recipientId).toBe("DK2v39r3hD9Lw8R5fFFHjUyCtXm1VETi42");
                    expect(transaction.senderPublicKey).toBe(
                        "035440a82cb44faef75c3d7d881696530aac4d50da314b91795740cdbeaba9113c",
                    );
                    expect(transaction.timestamp).toBe(timestamp);
                    expect(transaction.version).toBe(0x03);
                });
            });

            describe("fee", () => {
                it("should set the fee", () => {
                    const builder = provider();

                    builder.fee(255);
                    expect(builder.data.fee).toBe(255);
                });
            });

            describe("amount", () => {
                it("should set the amount", () => {
                    const builder = provider();

                    builder.amount(255);
                    expect(builder.data.amount).toBe(255);
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
                const keys = {
                    publicKey: "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af",
                };
                // @ts-ignore
                crypto.getKeys = jest.fn(() => keys);
                crypto.sign = jest.fn();

                builder.sign("dummy pass");

                expect(crypto.getKeys).toHaveBeenCalledWith("dummy pass");
                expect(crypto.sign).toHaveBeenCalledWith((builder as any).getSigningObject(), keys);
            });

            it("establishes the public key of the sender", () => {
                const builder = provider();
                const keys = {
                    publicKey: "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af",
                };
                // @ts-ignore
                crypto.getKeys = jest.fn(() => keys);
                crypto.sign = jest.fn();
                builder.sign("my real pass");
                expect(builder.data.senderPublicKey).toBe(keys.publicKey);
            });
        });

        describe("signWithWif", () => {
            it("signs this transaction with keys from a wif", () => {
                const builder = provider();
                const keys = {
                    publicKey: "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af",
                };
                // @ts-ignore
                crypto.getKeysFromWIF = jest.fn(() => keys);
                crypto.sign = jest.fn();

                builder.network(23).signWithWif("dummy pass");

                expect(crypto.getKeysFromWIF).toHaveBeenCalledWith("dummy pass", {
                    wif: 170,
                });
                expect(crypto.sign).toHaveBeenCalledWith((builder as any).getSigningObject(), keys);
            });

            it("establishes the public key of the sender", () => {
                const builder = provider();
                const keys = {
                    publicKey: "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af",
                };
                // @ts-ignore
                crypto.getKeysFromWIF = jest.fn(() => keys);
                crypto.sign = jest.fn();
                builder.signWithWif("my real pass");
                expect(builder.data.senderPublicKey).toBe(keys.publicKey);
            });
        });

        describe("secondSign", () => {
            it("signs this transaction with the keys of the second passphrase", () => {
                const builder = provider();
                let keys;
                crypto.getKeys = jest.fn(pass => {
                    keys = { publicKey: `${pass} public key` };
                    return keys;
                });
                crypto.secondSign = jest.fn();

                builder.secondSign("my very real second pass");

                expect(crypto.getKeys).toHaveBeenCalledWith("my very real second pass");
                expect(crypto.secondSign).toHaveBeenCalledWith((builder as any).getSigningObject(), keys);
            });
        });

        describe("secondSignWithWif", () => {
            it("signs this transaction with the keys of a second wif", () => {
                const builder = provider();
                let keys;
                crypto.getKeysFromWIF = jest.fn(pass => {
                    keys = { publicKey: `${pass} public key` };
                    return keys;
                });
                crypto.secondSign = jest.fn();

                builder.network(23).secondSignWithWif("my very real second pass", null);

                expect(crypto.getKeysFromWIF).toHaveBeenCalledWith("my very real second pass", { wif: 170 });
                expect(crypto.secondSign).toHaveBeenCalledWith((builder as any).getSigningObject(), keys);
            });
        });
    });
};
