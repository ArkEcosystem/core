import "jest-extended";

import { Utils } from "@arkecosystem/crypto";
import { crypto } from "../../../../packages/crypto/src/crypto";
import { TransactionTypes } from "../../../../packages/crypto/src/enums";
import { PublicKeyError, TransactionVersionError } from "../../../../packages/crypto/src/errors";
import { ITransactionData } from "../../../../packages/crypto/src/interfaces";
import { configManager } from "../../../../packages/crypto/src/managers";

const networkMainnet = configManager.getPreset("mainnet");
const networkDevnet = configManager.getPreset("devnet");

beforeEach(() => configManager.setFromPreset("devnet"));

describe("crypto.ts", () => {
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
            const result = crypto.getHash(transaction);
            expect(result).toBeObject();
            expect(result).toHaveLength(32);
            expect(result.toString("hex")).toBe("952e33b66c35a3805015657c008e73a0dee1efefd9af8c41adb59fe79745ccea");
        });

        it("should throw for unsupported versions", () => {
            expect(() => crypto.getHash(Object.assign({}, transaction, { version: 110 }))).toThrow(
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
            const id = crypto.getId(transaction); // old id
            expect(id).toBeString();
            expect(id).toBe("952e33b66c35a3805015657c008e73a0dee1efefd9af8c41adb59fe79745ccea");
        });

        it("should throw for unsupported version", () => {
            expect(() => crypto.getId(Object.assign({}, transaction, { version: 110 }))).toThrow(
                TransactionVersionError,
            );
        });
    });

    describe("getFee", () => {
        it("should return 10000000", () => {
            expect(crypto.getFee({ type: TransactionTypes.Transfer } as ITransactionData)).toEqual(
                Utils.BigNumber.make(10000000),
            );
        });
    });

    describe("sign", () => {
        const keys = crypto.getKeys("secret");
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
            const signature = crypto.sign(transaction, keys);
            // @ts-ignore
            expect(signature.toString("hex")).toBe(
                "3045022100f5c4ec7b3f9a2cb2e785166c7ae185abbff0aa741cbdfe322cf03b914002efee02206261cd419ea9074b5d4a007f1e2fffe17a38338358f2ac5fcc65d810dbe773fe",
            );
        });

        it("should throw for unsupported versions", () => {
            expect(() => {
                crypto.sign(Object.assign({}, transaction, { version: 110 }), keys);
            }).toThrow(TransactionVersionError);
        });
    });

    describe("verify", () => {
        const keys = crypto.getKeys("secret");
        const transaction: any = {
            type: 0,
            amount: Utils.BigNumber.make(1000),
            fee: Utils.BigNumber.make(2000),
            recipientId: "AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff",
            timestamp: 141738,
            asset: {},
            senderPublicKey: keys.publicKey,
        };
        const signature = crypto.sign(transaction, keys);

        const otherPublicKey = "0203bc6522161803a4cd9d8c7b7e3eb5b29f92106263a3979e3e02d27a70e830b4";

        it("should return true on a valid signature", () => {
            expect(crypto.verify(transaction)).toBeTrue();
        });

        it("should return false on an invalid signature", () => {
            expect(crypto.verify(Object.assign({}, transaction, { senderPublicKey: otherPublicKey }))).toBeFalse();
        });

        it("should return false on a missing signature", () => {
            const transactionWithoutSignature = Object.assign({}, transaction);
            delete transactionWithoutSignature.signature;

            expect(crypto.verify(transactionWithoutSignature)).toBeFalse();
        });
    });

    describe("verifySecondSignature", () => {
        const keys1 = crypto.getKeys("secret");
        const keys2 = crypto.getKeys("secret too");
        const transaction: any = {
            type: 0,
            amount: Utils.BigNumber.make(1000),
            fee: Utils.BigNumber.make(2000),
            recipientId: "AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff",
            timestamp: 141738,
            asset: {},
            senderPublicKey: keys1.publicKey,
        };
        const secondSignature = crypto.secondSign(transaction, keys2);
        transaction.signSignature = secondSignature;
        const otherPublicKey = "0203bc6522161803a4cd9d8c7b7e3eb5b29f92106263a3979e3e02d27a70e830b4";

        it("should return true on a valid signature", () => {
            expect(crypto.verifySecondSignature(transaction, keys2.publicKey)).toBeTrue();
        });

        it("should return false on an invalid second signature", () => {
            expect(crypto.verifySecondSignature(transaction, otherPublicKey)).toBeFalse();
        });

        it("should return false on a missing second signature", () => {
            const transactionWithoutSignature = Object.assign({}, transaction);
            delete transactionWithoutSignature.secondSignature;
            delete transactionWithoutSignature.signSignature;

            expect(crypto.verifySecondSignature(transactionWithoutSignature, keys2.publicKey)).toBeFalse();
        });

        it("should fail this.getHash for transaction version > 1", () => {
            const transactionV2 = Object.assign({}, transaction, { version: 2 });

            expect(() => crypto.verifySecondSignature(transactionV2, keys2.publicKey)).toThrow(TransactionVersionError);
        });
    });

    describe("getKeys", () => {
        it("should return two keys in hex", () => {
            const keys = crypto.getKeys("secret");

            expect(keys).toBeObject();
            expect(keys).toHaveProperty("publicKey");
            expect(keys).toHaveProperty("privateKey");

            expect(keys.publicKey).toBeString();
            expect(keys.publicKey).toMatch(Buffer.from(keys.publicKey, "hex").toString("hex"));

            expect(keys.privateKey).toBeString();
            expect(keys.privateKey).toMatch(Buffer.from(keys.privateKey, "hex").toString("hex"));
        });

        it("should return address", () => {
            const keys = crypto.getKeys("SDgGxWHHQHnpm5sth7MBUoeSw7V7nbimJ1RBU587xkryTh4qe9ov");
            const address = crypto.getAddress(keys.publicKey);
            expect(address).toBe("DUMjDrT8mgqGLWZtkCqzvy7yxWr55mBEub");
        });
    });

    describe("getKeysByPrivateKey", () => {
        it("should get keys from private key", () => {
            const expectedKeys = {
                publicKey: "03d04acca0ad922998d258438cc453ce50222b0e761ae9a499ead6a11f3a44b70b",
                privateKey: "c13bcd9a3dd64cabb27fcf2f4a471d35ffc3c114bb1278de745e6ff82a72eda8",
                compressed: true,
            };
            const keys = crypto.getKeysByPrivateKey(expectedKeys.privateKey);

            expect(keys).toEqual(expectedKeys);
        });
    });

    describe("getKeysFromWIF", () => {
        it("should return two keys in hex", () => {
            const keys = crypto.getKeysFromWIF("SDgGxWHHQHnpm5sth7MBUoeSw7V7nbimJ1RBU587xkryTh4qe9ov");

            expect(keys).toBeObject();
            expect(keys).toHaveProperty("publicKey");
            expect(keys).toHaveProperty("privateKey");

            expect(keys.publicKey).toBeString();
            expect(keys.publicKey).toMatch(Buffer.from(keys.publicKey, "hex").toString("hex"));

            expect(keys.privateKey).toBeString();
            expect(keys.privateKey).toMatch(Buffer.from(keys.privateKey, "hex").toString("hex"));
        });

        it("should return address", () => {
            const keys = crypto.getKeysFromWIF("SDgGxWHHQHnpm5sth7MBUoeSw7V7nbimJ1RBU587xkryTh4qe9ov");
            // @ts-ignore
            const address = crypto.getAddress(keys.publicKey.toString("hex"));
            expect(address).toBe("DCAaPzPAhhsMkHfQs7fZvXFW2EskDi92m8");
        });

        it("should get keys from compressed WIF", () => {
            const keys = crypto.getKeysFromWIF("SAaaKsDdWMXP5BoVnSBLwTLn48n96UvG42WSUUooRv1HrEHmaSd4");

            expect(keys).toBeObject();
            expect(keys).toHaveProperty("publicKey");
            expect(keys).toHaveProperty("privateKey");
            expect(keys).toHaveProperty("compressed", true);
        });

        it("should get keys from uncompressed WIF", () => {
            const keys = crypto.getKeysFromWIF("6hgnAG19GiMUf75C43XteG2mC8esKTiX9PYbKTh4Gca9MELRWmg");

            expect(keys).toBeObject();
            expect(keys).toHaveProperty("publicKey");
            expect(keys).toHaveProperty("privateKey");
            expect(keys).toHaveProperty("compressed", false);
        });
    });

    describe("keysToWIF", () => {
        it("should get keys from WIF", () => {
            const wifKey = "SAaaKsDdWMXP5BoVnSBLwTLn48n96UvG42WSUUooRv1HrEHmaSd4";
            const keys = crypto.getKeysFromWIF(wifKey);
            const actual = crypto.keysToWIF(keys);

            expect(keys.compressed).toBeTruthy();
            expect(actual).toBe(wifKey);
        });

        it("should get address from compressed WIF (mainnet)", () => {
            const keys = crypto.getKeysFromWIF(
                "SAaaKsDdWMXP5BoVnSBLwTLn48n96UvG42WSUUooRv1HrEHmaSd4",
                networkMainnet.network,
            );
            const address = crypto.getAddress(keys.publicKey, networkMainnet.network.pubKeyHash);
            expect(keys.compressed).toBeTruthy();
            expect(address).toBe("APnrtb2JGa6WjrRik9W3Hjt6h71mD6Zgez");
        });

        it("should get address from compressed WIF (devnet)", () => {
            const keys = crypto.getKeysFromWIF(
                "SAaaKsDdWMXP5BoVnSBLwTLn48n96UvG42WSUUooRv1HrEHmaSd4",
                networkDevnet.network,
            );
            const address = crypto.getAddress(keys.publicKey, networkDevnet.network.pubKeyHash);
            expect(keys.compressed).toBeTruthy();
            expect(address).toBe("DDA5nM7KEqLeTtQKv5qGgcnc6dpNBKJNTS");
        });
    });

    describe("getAddress", () => {
        it("should generate address by publicKey", () => {
            const keys = crypto.getKeys("secret");
            const address = crypto.getAddress(keys.publicKey);

            expect(address).toBeString();
            expect(address).toBe("D7seWn8JLVwX4nHd9hh2Lf7gvZNiRJ7qLk");
        });

        it("should generate address by publicKey - second test", () => {
            const keys = crypto.getKeys("secret second test to be sure it works correctly");
            const address = crypto.getAddress(keys.publicKey);

            expect(address).toBeString();
            expect(address).toBe("DDp4SYpnuzFPuN4W79PYY762d7FtW3DFFN");
        });

        it("should not throw an error if the publicKey is valid", () => {
            try {
                const validKeys = [
                    "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af",
                    "a".repeat(66),
                ];
                for (const validKey of validKeys) {
                    crypto.getAddress(validKey);
                }
            } catch (error) {
                throw new Error("Should not have failed to call getAddress with a valid publicKey");
            }
        });

        it("should throw an error if the publicKey is invalid", () => {
            const invalidKeys = ["invalid", "a".repeat(65), "a".repeat(67), "z".repeat(66)];
            for (const invalidKey of invalidKeys) {
                expect(() => crypto.getAddress(invalidKey)).toThrow(PublicKeyError);
            }
        });
    });

    describe("validate address on different networks", () => {
        it("should validate MAINNET addresses", () => {
            configManager.setConfig(networkMainnet);

            expect(crypto.validateAddress("AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX")).toBeTrue();
        });

        it("should validate DEVNET addresses", () => {
            configManager.setConfig(networkDevnet);

            expect(crypto.validateAddress("DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN")).toBeTrue();
        });
    });

    describe("validate public key on different networks", () => {
        it("should validate MAINNET public keys", () => {
            configManager.setConfig(networkMainnet);

            expect(
                crypto.validatePublicKey("02b54f00d9de5a3ace28913fe78a15afcfe242926e94d9b517d06d2705b261f992"),
            ).toBeTrue();
        });

        it("should validate DEVNET public keys", () => {
            configManager.setConfig(networkDevnet);

            expect(
                crypto.validatePublicKey("03b906102928cf97c6ddeb59cefb0e1e02105a22ab1acc3b4906214a16d494db0a"),
            ).toBeTrue();
        });
    });
});
