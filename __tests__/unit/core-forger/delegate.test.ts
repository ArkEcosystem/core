import "jest-extended";

import { Managers, Networks, Types, Utils } from "@arkecosystem/crypto";
import { Delegate } from "../../../packages/core-forger/src/delegate";
import { TransactionFactory } from "../../helpers/transaction-factory";

const dummy = {
    plainPassphrase: "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire",
    bip38Passphrase: "6PYTQC4c2vBv6PGvV4HibNni6wNsHsGbR1qpL1DfkCNihsiWwXnjvJMU4B",
    publicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
    address: "ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo",
};

describe("Delegate", () => {
    beforeAll(() => Managers.configManager.setFromPreset("testnet"));

    describe("constructor", () => {
        it("should be ok with a plain text passphrase", () => {
            const delegate = new Delegate(dummy.plainPassphrase, Networks.testnet.network);

            expect(delegate.publicKey).toBe(dummy.publicKey);
            expect(delegate.address).toBe(dummy.address);
            expect(delegate.bip38).toBeFalse();
        });

        describe("bip38", () => {
            it("should pass with a valid passphrase", () => {
                const delegate = new Delegate(dummy.bip38Passphrase, Networks.testnet.network, "bip38-password");

                expect(delegate.publicKey).toBe(dummy.publicKey);
                expect(delegate.address).toBe(dummy.address);
                expect(delegate.bip38).toBeTrue();
            });

            it("should fail with an invalid passphrase", () => {
                expect(
                    () => new Delegate(dummy.bip38Passphrase, Networks.testnet.network, "invalid-password"),
                ).toThrow();
            });
        });
    });

    describe("encryptPassphrase", () => {
        it("should pass with valid data", () => {
            const passphrase = Delegate.encryptPassphrase(
                dummy.plainPassphrase,
                Networks.testnet.network,
                "bip38-password",
            );

            expect(passphrase).toBe(dummy.bip38Passphrase);
        });

        it("should fail with invalid data", () => {
            expect(() => {
                Delegate.encryptPassphrase(dummy.plainPassphrase, {} as Types.NetworkType, "bip38-password");
            }).toThrow();
        });
    });

    describe("decryptPassphrase", () => {
        it("should pass with a valid password", () => {
            const { publicKey } = Delegate.decryptPassphrase(
                dummy.bip38Passphrase,
                Networks.testnet.network,
                "bip38-password",
            );

            expect(publicKey).toBe(dummy.publicKey);
        });

        it("should fail with an invalid password", () => {
            expect(() => {
                Delegate.decryptPassphrase(dummy.bip38Passphrase, Networks.testnet.network, "invalid-password");
            }).toThrow();
        });
    });

    describe("encryptKeysWithOtp", () => {
        it("should pass with a valid OTP secret", () => {
            const delegate = new Delegate(dummy.plainPassphrase, Networks.testnet.network);
            delegate.otpSecret = "one-time-password";

            delegate.encryptKeysWithOtp();

            expect(delegate.otp).toBeString();
            expect(delegate.encryptedKeys).toBeString();
            expect(delegate.keys).toBeUndefined();
        });

        it("should fail without an OTP secret", () => {
            const delegate = new Delegate(dummy.plainPassphrase, Networks.testnet.network);
            delegate.otpSecret = undefined;

            expect(() => {
                delegate.encryptKeysWithOtp();
            }).toThrow();
        });
    });

    describe("decryptKeysWithOtp", () => {
        it("should pass with valid data", () => {
            const delegate = new Delegate(dummy.plainPassphrase, Networks.testnet.network);
            delegate.otpSecret = "one-time-password";

            delegate.encryptKeysWithOtp();

            expect(delegate.otp).toBeString();
            expect(delegate.encryptedKeys).toBeString();
            expect(delegate.keys).toBeUndefined();

            delegate.decryptKeysWithOtp();

            expect(delegate.otp).toBeUndefined();
            expect(delegate.encryptedKeys).toBeUndefined();
            expect(delegate.keys).toBeObject();
        });

        it("should fail with missing encrypted data", () => {
            const delegate = new Delegate(dummy.plainPassphrase, Networks.testnet.network);

            expect(() => {
                delegate.decryptKeysWithOtp();
            }).toThrow();
        });

        it("should fail with invalid encrypted data", () => {
            const delegate = new Delegate(dummy.plainPassphrase, Networks.testnet.network);
            delegate.otpSecret = "one-time-password";

            delegate.encryptKeysWithOtp();

            expect(delegate.otp).toBeString();
            expect(delegate.encryptedKeys).toBeString();
            expect(delegate.keys).toBeUndefined();

            delegate.encryptedKeys = undefined;

            expect(() => {
                delegate.decryptKeysWithOtp();
            }).toThrow();
        });
    });

    describe("forge", () => {
        const optionsDefault = {
            timestamp: 12345689,
            previousBlock: {
                id: "11111111",
                idHex: "11111111",
                height: 1,
            },
            reward: Utils.BigNumber.ZERO,
        };

        Managers.configManager.getMilestone().aip11 = true;
        const transactions = TransactionFactory.secondSignature(dummy.plainPassphrase)
            .withPassphrase(dummy.plainPassphrase)
            .create();
        const expectedBlockData = {
            generatorPublicKey: dummy.publicKey,
            timestamp: optionsDefault.timestamp,
            previousBlock: optionsDefault.previousBlock.id,
            height: optionsDefault.previousBlock.height + 1,
            numberOfTransactions: 1,
            totalAmount: transactions[0].amount,
            totalFee: transactions[0].fee,
            reward: optionsDefault.reward,
        };

        it("should forge a block", () => {
            const delegate = new Delegate(dummy.plainPassphrase, Networks.testnet.network);

            const block = delegate.forge(transactions, optionsDefault);

            for (const key of Object.keys(expectedBlockData)) {
                expect(block.data[key]).toEqual(expectedBlockData[key]);
            }
            expect(block.verification).toEqual({
                containsMultiSignatures: false,
                errors: [],
                verified: true,
            });
            expect(block.transactions).toHaveLength(1);
            expect(block.transactions[0].id).toBe(transactions[0].id);
        });

        it("should forge a block - bip38", () => {
            const delegate = new Delegate(dummy.bip38Passphrase, Networks.testnet.network, "bip38-password");

            const spyDecryptKeys = jest.spyOn(delegate, "decryptKeysWithOtp");
            const spyEncryptKeys = jest.spyOn(delegate, "encryptKeysWithOtp");

            const block = delegate.forge(transactions, optionsDefault);

            expect(spyDecryptKeys).toHaveBeenCalledTimes(1);
            expect(spyEncryptKeys).toHaveBeenCalledTimes(1);

            for (const key of Object.keys(expectedBlockData)) {
                expect(block.data[key]).toEqual(expectedBlockData[key]);
            }
            expect(block.verification).toEqual({
                containsMultiSignatures: false,
                errors: [],
                verified: true,
            });
            expect(block.transactions).toHaveLength(1);
            expect(block.transactions[0].id).toBe(transactions[0].id);
        });

        it("should not forge a block if options.version is defined", () => {
            const delegate = new Delegate(dummy.plainPassphrase, Networks.testnet.network);

            const options = {
                version: "2.0.0",
            };

            const block = delegate.forge(transactions, options);
            expect(block).toBeUndefined();
        });

        it("should not forge a block if bip38 is on but encryptedKeys is not set", () => {
            const delegate = new Delegate(dummy.bip38Passphrase, Networks.testnet.network, "bip38-password");
            delegate.encryptedKeys = undefined;

            const block = delegate.forge(transactions, optionsDefault);
            expect(block).toBeUndefined();
        });

        it("should forge a block with transactions ordered by nonce", () => {
            const transfers = TransactionFactory.transfer()
                .withPassphrase(dummy.plainPassphrase)
                .create(10);

            const delegate = new Delegate(dummy.plainPassphrase, Networks.testnet.network);

            const block = delegate.forge(transfers, optionsDefault);

            expect(block.verification).toEqual({
                containsMultiSignatures: false,
                errors: [],
                verified: true,
            });
            expect(block.transactions.map(tx => tx.data.nonce)).toEqual(
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => new Utils.BigNumber(n)),
            );
        });
    });
});
