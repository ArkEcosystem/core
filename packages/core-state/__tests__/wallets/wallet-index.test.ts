import { Wallets } from "@packages/core-state/src";
import { WalletIndex } from "@packages/core-state/src/wallets/wallet-index";
import { Factory } from "@packages/core-test-framework/src/factories/factory";

import { setUp } from "../setup";

let factory: Factory;

let wallet: Wallets.Wallet;
let walletIndex: WalletIndex;

beforeAll(async () => {
    const initialEnv = await setUp();
    factory = initialEnv.factory.get("Wallet");
});

beforeEach(() => {
    wallet = factory.make<Wallets.Wallet>();
    walletIndex = new WalletIndex((index, wallet) => {
        index.set(wallet.getAddress(), wallet);
    }, true);
});

describe("WalletIndex", () => {
    it("should return entries", () => {
        walletIndex.index(wallet);
        const entries = walletIndex.entries();
        expect(entries.length).toEqual(1);
        expect(entries[0][0]).toEqual(entries[0][1].getAddress());
        expect(entries[0][0]).toEqual(wallet.getAddress());
    });

    it("should return keys", () => {
        walletIndex.index(wallet);
        expect(walletIndex.keys()).toContain(wallet.getAddress());
    });

    it("should return walletKeys", () => {
        expect(walletIndex.walletKeys(wallet)).toEqual([]);

        walletIndex.index(wallet);
        expect(walletIndex.walletKeys(wallet)).toEqual([wallet.getAddress()]);
    });

    describe("set", () => {
        it("should set and get addresses", () => {
            expect(walletIndex.has(wallet.getAddress())).toBeFalse();

            walletIndex.index(wallet);
            walletIndex.set(wallet.getAddress(), wallet);

            expect(walletIndex.get(wallet.getAddress())).toBe(wallet);
            expect(walletIndex.has(wallet.getAddress())).toBeTrue();

            expect(walletIndex.values()).toContain(wallet);

            walletIndex.clear();
            expect(walletIndex.has(wallet.getAddress())).toBeFalse();
        });

        it("should override key with new wallet", () => {
            const anotherWallet = factory.make<Wallets.Wallet>();

            walletIndex.set("key1", wallet);
            walletIndex.set("key1", anotherWallet);

            expect(walletIndex.get("key1")).toBe(anotherWallet);

            const entries = walletIndex.entries();
            expect(entries.length).toEqual(1);
        });
    });

    describe("forget", () => {
        it("should index and forget wallets", () => {
            expect(walletIndex.has(wallet.getAddress())).toBeFalse();

            walletIndex.index(wallet);
            expect(walletIndex.has(wallet.getAddress())).toBeTrue();

            walletIndex.forget(wallet.getAddress());
            expect(walletIndex.has(wallet.getAddress())).toBeFalse();
        });

        it("should not throw if key is not indexed", () => {
            walletIndex.forget(wallet.getAddress());
        });
    });

    describe("forgetWallet", () => {
        it("should forget wallet", () => {
            walletIndex.index(wallet);
            expect(walletIndex.get(wallet.getAddress())).toBe(wallet);

            walletIndex.forgetWallet(wallet);
            expect(walletIndex.get(wallet.getAddress())).toBeUndefined();
        });

        it("should not throw if wallet is not indexed", () => {
            walletIndex.forgetWallet(wallet);
        });
    });
});
