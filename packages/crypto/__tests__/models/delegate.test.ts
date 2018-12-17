import "jest-extended";

import { ARKTOSHI } from "../../src/constants";
import { configManager } from "../../src/managers/config";
import { Delegate } from "../../src/models/delegate";
import { Wallet } from "../../src/models/wallet";
import { testnet } from "../../src/networks";
import { Bignum } from "../../src/utils/bignum";
import { sortTransactions } from "../../src/utils/sort-transactions";

const dummy = {
    plainPassphrase: "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire",
    bip38Passphrase: "6PYTQC4c2vBv6PGvV4HibNni6wNsHsGbR1qpL1DfkCNihsiWwXnjvJMU4B",
    publicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
    address: "ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo",
};

describe("Models - Delegate", () => {
    describe("constructor", () => {
        it("should be ok with a plain text passphrase", () => {
            const delegate = new Delegate(dummy.plainPassphrase, testnet.network);

            expect(delegate.publicKey).toBe(dummy.publicKey);
            expect(delegate.address).toBe(dummy.address);
            expect(delegate.bip38).toBeFalse();
        });

        describe("bip38", () => {
            it("should pass with a valid passphrase", () => {
                const delegate = new Delegate(dummy.bip38Passphrase, testnet.network, "bip38-password");

                expect(delegate.publicKey).toBe(dummy.publicKey);
                expect(delegate.address).toBe(dummy.address);
                expect(delegate.bip38).toBeTrue();
            });

            it("should fail with an invalid passphrase", () => {
                const delegate = new Delegate(dummy.bip38Passphrase, testnet.network, "invalid-password");

                expect(delegate.publicKey).toBeNull();
                expect(delegate.address).toBeNull();
                expect(delegate.bip38).toBeFalse();
            });
        });
    });

    describe("encryptPassphrase", () => {
        it("should pass with valid data", () => {
            const passphrase = Delegate.encryptPassphrase(dummy.plainPassphrase, testnet.network, "bip38-password");

            expect(passphrase).toBe(dummy.bip38Passphrase);
        });

        it("should fail with invalid data", () => {
            expect(() => {
                Delegate.encryptPassphrase(dummy.plainPassphrase, {}, "bip38-password");
            }).toThrow();
        });
    });

    describe("decryptPassphrase", () => {
        it("should pass with a valid password", () => {
            const { publicKey } = Delegate.decryptPassphrase(dummy.bip38Passphrase, testnet.network, "bip38-password");

            expect(publicKey).toBe(dummy.publicKey);
        });

        it("should fail with an invalid password", () => {
            expect(() => {
                Delegate.decryptPassphrase(dummy.bip38Passphrase, testnet.network, "invalid-password");
            }).toThrow();
        });
    });

    describe("encryptKeysWithOtp", () => {
        it("should pass with a valid OTP secret", () => {
            const delegate = new Delegate(dummy.plainPassphrase, testnet.network);
            delegate.otpSecret = "one-time-password";

            delegate.encryptKeysWithOtp();

            expect(delegate.otp).toBeString();
            expect(delegate.encryptedKeys).toBeString();
            expect(delegate.keys).toBeNull();
        });

        it("should fail without an OTP secret", () => {
            const delegate = new Delegate(dummy.plainPassphrase, testnet.network);
            delegate.otpSecret = undefined;

            expect(() => {
                delegate.encryptKeysWithOtp();
            }).toThrow();
        });
    });

    describe("decryptKeysWithOtp", () => {
        it("should pass with valid data", () => {
            const delegate = new Delegate(dummy.plainPassphrase, testnet.network);
            delegate.otpSecret = "one-time-password";

            delegate.encryptKeysWithOtp();

            expect(delegate.otp).toBeString();
            expect(delegate.encryptedKeys).toBeString();
            expect(delegate.keys).toBeNull();

            delegate.decryptKeysWithOtp();

            expect(delegate.otp).toBeNull();
            expect(delegate.encryptedKeys).toBeNull();
            expect(delegate.keys).toBeObject();
        });

        it("should fail with missing encrypted data", () => {
            const delegate = new Delegate(dummy.plainPassphrase, testnet.network);

            expect(() => {
                delegate.decryptKeysWithOtp();
            }).toThrow();
        });

        it("should fail with invalid encrypted data", () => {
            const delegate = new Delegate(dummy.plainPassphrase, testnet.network);
            delegate.otpSecret = "one-time-password";

            delegate.encryptKeysWithOtp();

            expect(delegate.otp).toBeString();
            expect(delegate.encryptedKeys).toBeString();
            expect(delegate.keys).toBeNull();

            delegate.encryptedKeys = undefined;

            expect(() => {
                delegate.decryptKeysWithOtp();
            }).toThrow();
        });
    });

    describe("sortTransactions", () => {
        it("returns the transactions ordered by type and id", () => {
            const ordered = [{ type: 1, id: 2 }, { type: 1, id: 8 }, { type: 2, id: 5 }, { type: 2, id: 9 }];
            const unordered = [ordered[3], ordered[2], ordered[1], ordered[0]];

            expect(sortTransactions(unordered)).toEqual(ordered);
        });
    });

    describe("forge", () => {
        describe("without version option", () => {
            it("doesn't sort the transactions", () => {
                const address = "Abcde";
                const wallet = new Wallet(address);
                wallet.balance = new Bignum(ARKTOSHI);

                expect(wallet.toString()).toBe(`${address} (1 ${configManager.config.client.symbol})`);
            });
        });
    });
});
