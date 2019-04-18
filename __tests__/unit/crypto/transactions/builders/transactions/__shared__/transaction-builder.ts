import { crypto, slots } from "../../../../../../../packages/crypto/src/crypto";
import { configManager } from "../../../../../../../packages/crypto/src/managers";
import { TransactionBuilder } from "../../../../../../../packages/crypto/src/transactions/builders/transactions/transaction";
import * as Utils from "../../../../../../../packages/crypto/src/utils";

export const transactionBuilder = <T extends TransactionBuilder<T>>(provider: () => TransactionBuilder<T>) => {
    describe("TransactionBuilder", () => {
        beforeAll(() => {
            configManager.setFromPreset("testnet");
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        describe("inherits = require(TransactionBuilder", () => {
            it("should have the essential properties", () => {
                const builder = provider();

                expect(builder).toHaveProperty("data.id", null);
                expect(builder).toHaveProperty("data.timestamp");
                expect(builder).toHaveProperty("data.version");

                expect(builder).toHaveProperty("data.type");
                expect(builder).toHaveProperty("data.fee");
            });

            describe("builder", () => {
                let timestamp;
                let data;

                beforeEach(() => {
                    timestamp = slots.getTime();

                    data = {
                        id: "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8dae1a1f",
                        amount: Utils.BigNumber.ONE,
                        fee: Utils.BigNumber.ONE,
                        recipientId: "AZT6b2Vm6VgNF7gW49M4wvUVBBntWxdCj5",
                        senderPublicKey: "039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22",
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
                    expect(transaction.data.recipientId).toBe("AZT6b2Vm6VgNF7gW49M4wvUVBBntWxdCj5");
                    expect(transaction.data.senderPublicKey).toBe(
                        "039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22",
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
                    expect(transaction.data.recipientId).toBe("AZT6b2Vm6VgNF7gW49M4wvUVBBntWxdCj5");
                    expect(transaction.data.senderPublicKey).toBe(
                        "039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22",
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
            afterEach(() => {
                jest.resetAllMocks();
            });

            it("should sign the transaction", () => {
                const keys = {
                    publicKey: "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af",
                    privateKey: "",
                    compressed: true,
                };

                const builder = provider();

                const getKeys = jest.spyOn(crypto, "getKeys").mockImplementation(() => keys);
                const sign = jest.spyOn(crypto, "sign").mockImplementation();

                builder.sign("dummy pass");
                expect(getKeys).toHaveBeenCalledWith("dummy pass");
                expect(sign).toHaveBeenCalledWith((builder as any).getSigningObject(), keys);
            });

            it("establishes the public key of the sender", () => {
                const builder = provider();
                const keys = {
                    publicKey: "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af",
                    privateKey: "",
                    compressed: true,
                };

                jest.spyOn(crypto, "getKeys").mockImplementation(() => keys);
                jest.spyOn(crypto, "sign").mockImplementation();

                builder.sign("my real pass");
                expect(builder.data.senderPublicKey).toBe(keys.publicKey);
            });
        });

        describe("signWithWif", () => {
            afterEach(() => {
                jest.resetAllMocks();
            });

            it("should sign the transaction", () => {
                const builder = provider();
                const keys = {
                    publicKey: "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af",
                    privateKey: "",
                    compressed: true,
                };

                jest.spyOn(crypto, "getKeysFromWIF").mockImplementation(() => keys);
                jest.spyOn(crypto, "sign").mockImplementation();

                builder.network(23).signWithWif("dummy pass");

                expect(crypto.getKeysFromWIF).toHaveBeenCalledWith("dummy pass", {
                    wif: 186,
                });
                expect(crypto.sign).toHaveBeenCalledWith((builder as any).getSigningObject(), keys);
            });

            it("establishes the public key of the sender", () => {
                const builder = provider();
                const keys = {
                    publicKey: "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af",
                    privateKey: "",
                    compressed: true,
                };

                jest.spyOn(crypto, "getKeysFromWIF").mockImplementation(() => keys);
                jest.spyOn(crypto, "sign").mockImplementation();

                builder.signWithWif("my real pass");
                expect(builder.data.senderPublicKey).toBe(keys.publicKey);
            });
        });

        describe("secondSign", () => {
            it("should second sign the transaction", () => {
                const builder = provider();

                let keys;
                const getKeys = jest.spyOn(crypto, "getKeys").mockImplementation(pass => {
                    keys = { publicKey: `${pass} public key` };
                    return keys;
                });

                const secondSign = jest.spyOn(crypto, "secondSign").mockImplementation(jest.fn());

                builder.secondSign("my very real second pass");

                expect(getKeys).toHaveBeenCalledWith("my very real second pass");
                expect(secondSign).toHaveBeenCalledWith((builder as any).getSigningObject(), keys);
            });
        });

        describe("secondSignWithWif", () => {
            it("signs this transaction with the keys of a second wif", () => {
                const builder = provider();

                let keys;
                const getKeysFromWIF = jest.spyOn(crypto, "getKeysFromWIF").mockImplementation(pass => {
                    keys = { publicKey: `${pass} public key` };
                    return keys;
                });

                const secondSign = jest.spyOn(crypto, "secondSign").mockImplementation(jest.fn());

                builder.network(23).secondSignWithWif("my very real second pass", null);

                expect(getKeysFromWIF).toHaveBeenCalledWith("my very real second pass", { wif: 186 });
                expect(secondSign).toHaveBeenCalledWith((builder as any).getSigningObject(), keys);
            });
        });
    });
};
