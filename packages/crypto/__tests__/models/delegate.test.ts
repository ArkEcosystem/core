import "jest-extended";

import bip38 from "bip38";
import { ARKTOSHI } from "../../src/constants";
import { PrivateKey } from "../../src/identities";
import { configManager } from "../../src/managers/config";
import { Delegate } from "../../src/models/delegate";
import { Wallet } from "../../src/models/wallet";
import { testnet } from "../../src/networks/ark";
import { Bignum } from "../../src/utils/bignum";
import { sortTransactions } from "../../src/utils/sort-transactions";

const plainPassphrase: string = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";
const bip38Passphrase: string = "6PYTQC4c2vBv6PGvV4HibNni6wNsHsGbR1qpL1DfkCNihsiWwXnjvJMU4B";

describe("Models - Delegate", () => {
    describe("constructor", () => {
        it("should be ok with a plain text passphrase", () => {
            const delegate = new Delegate(plainPassphrase, testnet);

            expect(delegate.publicKey).toBe("03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37");
            expect(delegate.address).toBe("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
            expect(delegate.bip38).toBeFalse();
        });

        describe("bip38", () => {
            it("should pass with a valid passphrase", () => {
                const delegate = new Delegate(bip38Passphrase, testnet, "bip38-password");

                expect(delegate.publicKey).toBe("03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37");
                expect(delegate.address).toBe("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
                expect(delegate.bip38).toBeTrue();
            });

            it("should fail with an invalid passphrase", () => {
                const delegate = new Delegate(bip38Passphrase, testnet, "invalid-password");

                expect(delegate.publicKey).toBeNull();
                expect(delegate.address).toBeNull();
                expect(delegate.bip38).toBeFalse();
            });
        });
    });

    describe("static sortTransactions", () => {
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
