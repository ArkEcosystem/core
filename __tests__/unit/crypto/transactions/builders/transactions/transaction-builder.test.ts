import { CryptoManager, Interfaces, Transactions } from "@arkecosystem/crypto/src";
import * as Generators from "@packages/core-test-framework/src/app/generators";

import { constructIdentity } from "../../__support__/identitity";

let crypto: CryptoManager<any>;
let transactionsManager: Transactions.TransactionsManager<any, Interfaces.ITransactionData, any>;

beforeAll(() => {
    crypto = CryptoManager.createFromConfig(Generators.generateCryptoConfigRaw());

    transactionsManager = new Transactions.TransactionsManager(crypto, {
        extendTransaction: () => {},
        // @ts-ignore
        validate: (_, data) => ({
            value: data,
        }),
    });
});

describe.each([
    "transfer",
    "secondSignature",
    "delegateRegistration",
    "vote",
    "multiSignature",
    "ipfs",
    "multiPayment",
    "delegateResignation",
    "htlcLock",
    "htlcClaim",
    "htlcRefund",
])("%s", (provider) => {
    describe("TransactionBuilder", () => {
        let identity;
        let identitySecond;
        let builder;

        beforeEach(() => {
            //
            builder = transactionsManager.BuilderFactory[provider]();

            identity = constructIdentity("this is a top secret passphrase", crypto);

            identitySecond = constructIdentity("this is a top secret second passphrase", crypto);
        });

        afterEach(() => jest.restoreAllMocks());

        describe("inherits TransactionBuilder", () => {
            it("should have the essential properties", () => {
                expect(builder).toHaveProperty("data.id", undefined);
                expect(builder).toHaveProperty("data.timestamp");
                expect(builder).toHaveProperty("data.version");

                expect(builder).toHaveProperty("data.type");
                expect(builder).toHaveProperty("data.fee");
            });

            describe("builder", () => {
                let nonce;
                let data;

                beforeEach(() => {
                    nonce = crypto.LibraryManager.Libraries.BigNumber.make(0);

                    data = {
                        id: "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8dae1a1f",
                        amount: crypto.LibraryManager.Libraries.BigNumber.ONE,
                        fee: crypto.LibraryManager.Libraries.BigNumber.ONE,
                        recipientId: "AZT6b2Vm6VgNF7gW49M4wvUVBBntWxdCj5",
                        senderPublicKey: "039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22",
                        nonce,
                        type: 0,
                        version: 0x02,
                    };
                });

                it("should return a Transaction model with the builder data", () => {
                    builder.data = data;

                    const transaction = builder.build();

                    expect(transaction.type).toBe(0);
                    expect(transaction.data.amount).toEqual(crypto.LibraryManager.Libraries.BigNumber.ONE);
                    expect(transaction.data.fee).toEqual(crypto.LibraryManager.Libraries.BigNumber.ONE);
                    expect(transaction.data.recipientId).toBe("AZT6b2Vm6VgNF7gW49M4wvUVBBntWxdCj5");
                    expect(transaction.data.senderPublicKey).toBe(
                        "039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22",
                    );
                    expect(transaction.data.nonce).toEqual(nonce);
                    expect(transaction.data.version).toBe(0x02);
                });

                it("could merge and override the builder data", () => {
                    builder.data = data;

                    const transaction = builder.build({
                        amount: crypto.LibraryManager.Libraries.BigNumber.make(33),
                        fee: crypto.LibraryManager.Libraries.BigNumber.make(1000),
                    });

                    expect(transaction.data.amount).toEqual(crypto.LibraryManager.Libraries.BigNumber.make(33));
                    expect(transaction.data.fee).toEqual(crypto.LibraryManager.Libraries.BigNumber.make(1000));
                    expect(transaction.data.recipientId).toBe("AZT6b2Vm6VgNF7gW49M4wvUVBBntWxdCj5");
                    expect(transaction.data.senderPublicKey).toBe(
                        "039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22",
                    );
                    expect(transaction.data.nonce).toEqual(nonce);
                    expect(transaction.data.version).toBe(0x02);
                });
            });

            describe("fee", () => {
                it("should set the fee", () => {
                    builder.fee("255");
                    expect(builder.data.fee).toEqual(crypto.LibraryManager.Libraries.BigNumber.make(255));
                });
            });

            describe("amount", () => {
                it("should set the amount", () => {
                    builder.amount("255");
                    expect(builder.data.amount).toEqual(crypto.LibraryManager.Libraries.BigNumber.make(255));
                });
            });

            describe("recipientId", () => {
                it("should set the recipient id", () => {
                    builder.recipientId("fake");
                    expect(builder.data.recipientId).toBe("fake");
                });
            });

            describe("senderPublicKey", () => {
                it("should set the sender public key", () => {
                    builder.senderPublicKey("fake");
                    expect(builder.data.senderPublicKey).toBe("fake");
                });
            });
        });

        describe("sign", () => {
            it("signs this transaction with the keys of the passphrase", () => {
                const spyKeys = jest.spyOn(crypto.Identities.Keys, "fromPassphrase").mockReturnValueOnce(identity.keys);
                const spySign = jest.spyOn(transactionsManager.Signer, "sign").mockImplementationOnce(jest.fn());

                builder.sign(identity.bip39);

                expect(spyKeys).toHaveBeenCalledWith(identity.bip39);
                expect(spySign).toHaveBeenCalledWith(builder.getSigningObject(), identity.keys);
            });

            it("establishes the public key of the sender", () => {
                const spyKeys = jest.spyOn(crypto.Identities.Keys, "fromPassphrase").mockReturnValueOnce(identity.keys);
                const spySign = jest.spyOn(transactionsManager.Signer, "sign").mockImplementationOnce(jest.fn());

                builder.sign(identity.bip39);

                expect(builder.data.senderPublicKey).toBe(identity.keys.publicKey);
                expect(spyKeys).toHaveBeenCalledWith(identity.bip39);
                expect(spySign).toHaveBeenCalledWith(builder.getSigningObject(), identity.keys);
            });
        });

        describe("signWithWif", () => {
            it("signs this transaction with keys from a wif", () => {
                const spyKeys = jest.spyOn(crypto.Identities.Keys, "fromWIF").mockReturnValueOnce(identity.keys);
                const spySign = jest.spyOn(transactionsManager.Signer, "sign").mockImplementationOnce(jest.fn());

                builder.signWithWif(identity.bip39);

                expect(spyKeys).toHaveBeenCalledWith(identity.bip39);
                expect(spySign).toHaveBeenCalledWith(builder.getSigningObject(), identity.keys);
            });

            it("establishes the public key of the sender", () => {
                const spySign = jest.spyOn(transactionsManager.Signer, "sign").mockImplementationOnce(jest.fn());

                builder.signWithWif(identity.wif);

                expect(builder.data.senderPublicKey).toBe(identity.publicKey);
                expect(spySign).toHaveBeenCalledWith(builder.getSigningObject(), identity.keys);
            });
        });

        describe("secondSign", () => {
            it("should second sign the transaction", () => {
                const spyKeys = jest
                    .spyOn(crypto.Identities.Keys, "fromPassphrase")
                    .mockReturnValueOnce(identitySecond.keys);
                const spySecondSign = jest
                    .spyOn(transactionsManager.Signer, "secondSign")
                    .mockImplementationOnce(jest.fn());

                builder.secondSign(identitySecond.bip39);

                expect(spyKeys).toHaveBeenCalledWith(identitySecond.bip39);
                expect(spySecondSign).toHaveBeenCalledWith(builder.getSigningObject(), identitySecond.keys);
            });
        });

        describe("secondSignWithWif", () => {
            it("signs this transaction with the keys of a second wif", () => {
                const spyKeys = jest.spyOn(crypto.Identities.Keys, "fromWIF").mockReturnValueOnce(identitySecond.keys);
                const spySecondSign = jest
                    .spyOn(transactionsManager.Signer, "secondSign")
                    .mockImplementationOnce(jest.fn());

                builder.secondSignWithWif(identitySecond.bip39, undefined);

                expect(spyKeys).toHaveBeenCalledWith(identitySecond.bip39);
                expect(spySecondSign).toHaveBeenCalledWith(builder.getSigningObject(), identitySecond.keys);
            });
        });

        describe("multiSignWithWif", () => {
            it("signs this transaction with the keys of a multisig wif", () => {
                const spyKeys = jest.spyOn(crypto.Identities.Keys, "fromWIF").mockReturnValueOnce(identitySecond.keys);
                const spyMultiSign = jest
                    .spyOn(transactionsManager.Signer, "multiSign")
                    .mockImplementationOnce(jest.fn());

                builder.senderPublicKey(identity.publicKey).multiSignWithWif(0, identitySecond.bip39, undefined);

                expect(spyKeys).toHaveBeenCalledWith(identitySecond.bip39);
                expect(spyMultiSign).toHaveBeenCalledWith(builder.getSigningObject(), identitySecond.keys, 0);
            });
        });
    });
});
