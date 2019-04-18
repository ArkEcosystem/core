import "jest-extended";

import { Utils } from "@arkecosystem/crypto";
import {
    MalformedTransactionBytesError,
    TransactionSchemaError,
    TransactionTypeError,
    TransactionVersionError,
    UnkownTransactionError,
} from "../../../../packages/crypto/src/errors";
import { Keys, PublicKey } from "../../../../packages/crypto/src/identities";
import { ITransactionData } from "../../../../packages/crypto/src/interfaces";
import { configManager } from "../../../../packages/crypto/src/managers";
import { BuilderFactory, Transaction, TransactionFactory } from "../../../../packages/crypto/src/transactions";
import { transaction as transactionDataFixture } from "../fixtures/transaction";

let transactionData: ITransactionData;
let transactionDataJSON;

const createRandomTx = type => {
    let transaction;

    switch (type) {
        case 0: {
            // transfer
            transaction = BuilderFactory.transfer()
                .recipientId("DJLxkgm7JMortrGVh1ZrvDH39XALWLa83e")
                .amount("10000000000000")
                .vendorField(Math.random().toString(36))
                .sign(Math.random().toString(36))
                .secondSign(Math.random().toString(36))
                .build();
            break;
        }

        case 1: {
            // second signature
            transaction = BuilderFactory.secondSignature()
                .signatureAsset(Math.random().toString(36))
                .sign(Math.random().toString(36))
                .build();
            break;
        }

        case 2: {
            // delegate registration
            transaction = BuilderFactory.delegateRegistration()
                .usernameAsset("dummydelegate")
                .sign(Math.random().toString(36))
                .build();
            break;
        }

        case 3: {
            // vote registration
            transaction = BuilderFactory.vote()
                .votesAsset(["+036928c98ee53a1f52ed01dd87db10ffe1980eb47cd7c0a7d688321f47b5d7d760"])
                .sign(Math.random().toString(36))
                .build();
            break;
        }

        case 4: {
            // multisignature registration
            const passphrases = [1, 2, 3].map(() => Math.random().toString(36));
            const publicKeys = passphrases.map(passphrase => `+${PublicKey.fromPassphrase(passphrase)}`);
            const min = Math.min(1, publicKeys.length);
            const max = Math.max(1, publicKeys.length);
            const minSignatures = Math.floor(Math.random() * (max - min)) + min;

            const transactionBuilder = BuilderFactory.multiSignature()
                .multiSignatureAsset({
                    keysgroup: publicKeys,
                    min: minSignatures,
                    lifetime: Math.floor(Math.random() * (72 - 1)) + 1,
                })
                .sign(Math.random().toString(36));

            for (let i = 0; i < minSignatures; i++) {
                transactionBuilder.multiSignatureSign(passphrases[i]);
            }

            transaction = transactionBuilder.build();
            break;
        }
        default: {
            throw new TransactionTypeError(type);
        }
    }

    return transaction;
};

describe("Transaction", () => {
    beforeEach(() => {
        configManager.setFromPreset("devnet");

        transactionData = { ...transactionDataFixture };
        transactionDataJSON = {
            ...transactionData,
            ...{ amount: transactionData.amount.toFixed(), fee: transactionData.fee.toFixed() },
        };
    });

    describe("toBytes / fromBytes", () => {
        it("should verify all transactions", () => {
            [0, 1, 2, 3]
                .map(type => createRandomTx(type))
                .forEach(transaction => {
                    const newTransaction = TransactionFactory.fromBytes(Transaction.toBytes(transaction.data));

                    // TODO: Remove both from data when not needed
                    delete transaction.data.signSignature;
                    if (transaction.data.recipientId === null) {
                        delete transaction.data.recipientId;
                    }

                    // @TODO: double check
                    if (!transaction.data.secondSignature) {
                        delete transaction.data.secondSignature;
                    }

                    transaction.data.amount = Utils.BigNumber.make(transaction.data.amount).toFixed();
                    transaction.data.fee = Utils.BigNumber.make(transaction.data.fee).toFixed();

                    expect(newTransaction.toJson()).toMatchObject(transaction.data);
                    expect(newTransaction.verified).toBeTrue();
                });
        });

        it("should create a transaction", () => {
            const hex = Transaction.toBytes(transactionData).toString("hex");
            const transaction = TransactionFactory.fromHex(hex);
            expect(transaction).toBeInstanceOf(Transaction);
            expect(transaction.toJson()).toEqual(transactionDataJSON);
        });

        it("should throw when getting garbage", () => {
            expect(() => TransactionFactory.fromBytes(null)).toThrow(MalformedTransactionBytesError);
            expect(() => TransactionFactory.fromBytes(Buffer.from("garbage"))).toThrow(MalformedTransactionBytesError);
            expect(() => TransactionFactory.fromHex(null)).toThrow(MalformedTransactionBytesError);
            expect(() => TransactionFactory.fromHex("affe")).toThrow(MalformedTransactionBytesError);
        });

        it("should throw when getting an unsupported version", () => {
            let hex = Transaction.toBytes(transactionData).toString("hex");
            hex = hex.slice(0, 2) + "99" + hex.slice(4);
            expect(() => TransactionFactory.fromHex(hex)).toThrow(TransactionVersionError);
        });
    });

    describe("fromBytesUnsafe", () => {
        it("should be ok", () => {
            const bytes = Transaction.toBytes(transactionData);
            const id = transactionData.id;

            const transaction = TransactionFactory.fromBytesUnsafe(bytes, id);
            expect(transaction).toBeInstanceOf(Transaction);
            expect(transaction.toJson()).toEqual(transactionDataJSON);
        });
    });

    describe("fromData", () => {
        it("should match transaction id", () => {
            [0, 1, 2, 3]
                .map(type => createRandomTx(type))
                .forEach(transaction => {
                    const originalId = transaction.data.id;
                    const newTransaction = TransactionFactory.fromData(transaction.data);
                    expect(newTransaction.data.id).toEqual(originalId);
                });
        });

        it("should throw when getting garbage", () => {
            expect(() => TransactionFactory.fromData({} as ITransactionData)).toThrow(UnkownTransactionError);
            expect(() => TransactionFactory.fromData({ type: 0 } as ITransactionData)).toThrow(TransactionSchemaError);
        });
    });

    describe("should deserialize correctly some tests transactions", () => {
        describe("mainnet", () => {
            beforeEach(() => {
                configManager.setFromPreset("mainnet");
            });

            afterEach(() => {
                configManager.setFromPreset("devnet");
            });

            const txs = [
                {
                    id: "80d75c7b90288246199e4a97ba726bad6639595ef92ad7c2bd14fd31563241ab",
                    height: 918991,
                    type: 1,
                    timestamp: 7410965,
                    amount: Utils.BigNumber.make(0),
                    fee: Utils.BigNumber.make(500000000),
                    recipientId: "AP4UQ6j9hAHsxudpXh47RNQi7oF1AEfkAG",
                    senderPublicKey: "03ca269b2942104b2ad601ccfbe7bd30b14b99cb55210ef7c1a5e25b6669646b99",
                    signature:
                        "3045022100d01e0cf0813a722ab5ad92aece2d4d1c3a537422e2ea769182f9172417224e890220437e407db51c4c47393db2e5b1258b2e3ecb707738a5ffdc6e96f08aee7e9c74",
                    asset: {
                        signature: {
                            publicKey: "03c0e7e86dadd316275a31d84a1fdccd00cd26cc059982f95a1b24382c6ec2ceb0",
                        },
                    },
                },
            ];

            txs.forEach(tx =>
                it(`txid: ${tx.id}`, () => {
                    const newtx = TransactionFactory.fromData(tx);
                    expect(newtx.data.id).toEqual(tx.id);
                }),
            );
        });

        describe("devnet", () => {
            const txs = [
                {
                    id: "89f354918b36197269b0e5514f8da66f19829a024f664ccc124bfaabe0266e10",
                    version: 1,
                    timestamp: 48068690,
                    senderPublicKey: "03b7d1da5c1b9f8efd0737d47123eb9cf7eb6d58198ef31bb6f01aa04bc4dda19d",
                    recipientId: "DHPNjqCaTR9KYtC8nHh7Zt1G86Xj4YiU2V",
                    type: 1,
                    amount: Utils.BigNumber.make("0"),
                    fee: Utils.BigNumber.make("500000000"),
                    signature:
                        "3045022100e8e03bdac70e18f220feacba25c1575aa89d1ab61673e54eb2aff38439666d2702207e2d84290d7ef2571f5b2fab7e22a77dec96b1c4187cf9def15be74db98e2700",
                    asset: {
                        signature: {
                            publicKey: "03b7d1da5c1b9f8efd0737d47123eb9cf7eb6d58198ef31bb6f01aa04bc4dda19d",
                        },
                    },
                },
                {
                    id: "a50af2bb1f043d128480346d0b49f5b3165716d5c630c6b0978dc7aa168e77a8",
                    version: 1,
                    timestamp: 48068923,
                    senderPublicKey: "03173fd793c4bac0d64e9bd74ec5c2055716a7c0266feec9d6d94cb75be097b75d",
                    recipientId: "DQrj9eh9otRgz2jWdu1K1ASBQqZA6dTkra",
                    type: 1,
                    amount: Utils.BigNumber.make("0"),
                    fee: Utils.BigNumber.make("500000000"),
                    signature:
                        "3045022100b263d28a5da58b17c874a5666afab0657f8492266554ad8ff722b00d41e1493d02200c2156dd9b9c1739f1c2099e98b763952bc7ef0423ad9786dcd32f7ffaf4aafc",
                    asset: {
                        signature: {
                            publicKey: "03173fd793c4bac0d64e9bd74ec5c2055716a7c0266feec9d6d94cb75be097b75d",
                        },
                    },
                },
                {
                    id: "68e34dc1c417cbfb47e5deea142974bc24c8d03df206f168c8b23d6a4decff73",
                    version: 1,
                    timestamp: 48068956,
                    senderPublicKey: "02813ade967f05384e0567841d175294b4102c06c428011646e5ef989212925fcf",
                    recipientId: "D8PGSYLUC3CxYaXoKjMA2gjV4RaeBpwghZ",
                    type: 1,
                    amount: Utils.BigNumber.make("0"),
                    fee: Utils.BigNumber.make("500000000"),
                    signature:
                        "3045022100e593eb501e89941461e247606d088b6e226cc5b5224f89cede532d35f9b16250022034bbdd098493639221e808301e0a99c3790ef9c6d357ac10266c518a2a66066f",
                    asset: {
                        signature: {
                            publicKey: "02813ade967f05384e0567841d175294b4102c06c428011646e5ef989212925fcf",
                        },
                    },
                },
                {
                    id: "b4b3433be888b4b95b68b83a84a08e40d748b0ad92acf8487072ef01c1de251a",
                    version: 1,
                    timestamp: 48069792,
                    senderPublicKey: "03f9f9dafc06faf4a54be2e45cd7a5523e41f38bb439f6f93cf00a0990e7afc116",
                    recipientId: "DNuwcwYGTHDdhTPWMTYekhuGM1fFUpW9Jj",
                    type: 1,
                    amount: Utils.BigNumber.make("0"),
                    fee: Utils.BigNumber.make("500000000"),
                    signature:
                        "3044022052d1e5be426a79f827a67597fd460237de65e035593144e4e3afb0e82ab40f3802201d6e31892d000e73532bf8659851a3d221205d65ed1c0b8d08ce46b72c7f00ae",
                    asset: {
                        signature: {
                            publicKey: "03f9f9dafc06faf4a54be2e45cd7a5523e41f38bb439f6f93cf00a0990e7afc116",
                        },
                    },
                },
            ];
            txs.forEach(tx =>
                it(`txid: ${tx.id}`, () => {
                    const newtx = TransactionFactory.fromData(tx);
                    expect(newtx.data.id).toEqual(tx.id);
                }),
            );
        });
    });

    it("Signatures are verified", () => {
        [0, 1, 2, 3].map(type => createRandomTx(type)).forEach(tx => expect(tx.verify()).toBeTrue());
    });

    describe("getHash", () => {
        const transaction = {
            version: 1,
            type: 0,
            amount: Utils.BigNumber.make(1000),
            fee: Utils.BigNumber.make(2000),
            recipientId: "AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff",
            timestamp: 141738,
            asset: {},
            senderPublicKey: "5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09",
            signature:
                "618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a",
        };

        it("should return Buffer and Buffer most be 32 bytes length", () => {
            const result = Transaction.getHash(transaction);
            expect(result).toBeObject();
            expect(result).toHaveLength(32);
            expect(result.toString("hex")).toBe("952e33b66c35a3805015657c008e73a0dee1efefd9af8c41adb59fe79745ccea");
        });

        it("should throw for unsupported versions", () => {
            expect(() => Transaction.getHash(Object.assign({}, transaction, { version: 110 }))).toThrow(
                TransactionVersionError,
            );
        });
    });

    describe("getId", () => {
        const transaction = {
            type: 0,
            amount: Utils.BigNumber.make(1000),
            fee: Utils.BigNumber.make(2000),
            recipientId: "AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff",
            timestamp: 141738,
            asset: {},
            senderPublicKey: "5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09",
            signature:
                "618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a",
        };

        it("should return string id and be equal to 952e33b66c35a3805015657c008e73a0dee1efefd9af8c41adb59fe79745ccea", () => {
            const id = Transaction.getId(transaction); // old id
            expect(id).toBeString();
            expect(id).toBe("952e33b66c35a3805015657c008e73a0dee1efefd9af8c41adb59fe79745ccea");
        });

        it("should throw for unsupported version", () => {
            expect(() => Transaction.getId(Object.assign({}, transaction, { version: 110 }))).toThrow(
                TransactionVersionError,
            );
        });
    });

    describe("sign", () => {
        const keys = Keys.fromPassphrase("secret");
        const transaction = {
            type: 0,
            amount: Utils.BigNumber.make(1000),
            fee: Utils.BigNumber.make(2000),
            recipientId: "AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff",
            timestamp: 141738,
            asset: {},
            senderPublicKey: keys.publicKey,
        };

        it("should return a valid signature", () => {
            const signature = Transaction.sign(transaction, keys);
            // @ts-ignore
            expect(signature.toString("hex")).toBe(
                "3045022100f5c4ec7b3f9a2cb2e785166c7ae185abbff0aa741cbdfe322cf03b914002efee02206261cd419ea9074b5d4a007f1e2fffe17a38338358f2ac5fcc65d810dbe773fe",
            );
        });

        it("should throw for unsupported versions", () => {
            expect(() => {
                Transaction.sign(Object.assign({}, transaction, { version: 110 }), keys);
            }).toThrow(TransactionVersionError);
        });
    });

    describe("verify", () => {
        const keys = Keys.fromPassphrase("secret");
        const transaction: any = {
            type: 0,
            amount: Utils.BigNumber.make(1000),
            fee: Utils.BigNumber.make(2000),
            recipientId: "AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff",
            timestamp: 141738,
            asset: {},
            senderPublicKey: keys.publicKey,
        };
        Transaction.sign(transaction, keys);

        const otherPublicKey = "0203bc6522161803a4cd9d8c7b7e3eb5b29f92106263a3979e3e02d27a70e830b4";

        it("should return true on a valid signature", () => {
            expect(Transaction.verifyData(transaction)).toBeTrue();
        });

        it("should return false on an invalid signature", () => {
            expect(
                Transaction.verifyData(Object.assign({}, transaction, { senderPublicKey: otherPublicKey })),
            ).toBeFalse();
        });

        it("should return false on a missing signature", () => {
            const transactionWithoutSignature = Object.assign({}, transaction);
            delete transactionWithoutSignature.signature;

            expect(Transaction.verifyData(transactionWithoutSignature)).toBeFalse();
        });
    });

    describe("verifySecondSignature", () => {
        const keys1 = Keys.fromPassphrase("secret");
        const keys2 = Keys.fromPassphrase("secret too");
        const transaction: any = {
            type: 0,
            amount: Utils.BigNumber.make(1000),
            fee: Utils.BigNumber.make(2000),
            recipientId: "AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff",
            timestamp: 141738,
            asset: {},
            senderPublicKey: keys1.publicKey,
        };
        const secondSignature = Transaction.secondSign(transaction, keys2);
        transaction.signSignature = secondSignature;
        const otherPublicKey = "0203bc6522161803a4cd9d8c7b7e3eb5b29f92106263a3979e3e02d27a70e830b4";

        it("should return true on a valid signature", () => {
            expect(Transaction.verifySecondSignature(transaction, keys2.publicKey)).toBeTrue();
        });

        it("should return false on an invalid second signature", () => {
            expect(Transaction.verifySecondSignature(transaction, otherPublicKey)).toBeFalse();
        });

        it("should return false on a missing second signature", () => {
            const transactionWithoutSignature = Object.assign({}, transaction);
            delete transactionWithoutSignature.secondSignature;
            delete transactionWithoutSignature.signSignature;

            expect(Transaction.verifySecondSignature(transactionWithoutSignature, keys2.publicKey)).toBeFalse();
        });

        it("should fail this.getHash for transaction version > 1", () => {
            const transactionV2 = Object.assign({}, transaction, { version: 2 });

            expect(() => Transaction.verifySecondSignature(transactionV2, keys2.publicKey)).toThrow(
                TransactionVersionError,
            );
        });
    });
});
