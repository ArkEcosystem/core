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
        index.set(wallet.address, wallet);
    }, true);
});

describe("WalletIndex", () => {
    it("should be cloneable", () => {
        walletIndex.index(wallet);
        walletIndex.set(wallet.address, wallet);
        const clonedWalletIndex = walletIndex.clone();
        expect(walletIndex).toEqual(clonedWalletIndex);
    });

    it("should return entries", () => {
        walletIndex.index(wallet);
        const entries = walletIndex.entries();
        expect(entries.length).toEqual(1);
        expect(entries[0][0]).toEqual(entries[0][1].address);
        expect(entries[0][0]).toEqual(wallet.address);
    });

    it("should return keys", () => {
        walletIndex.index(wallet);
        expect(walletIndex.keys()).toContain(wallet.address);
    });

    describe("set", () => {
        it("should set and get addresses", () => {
            expect(walletIndex.has(wallet.address)).toBeFalse();

            walletIndex.index(wallet);
            walletIndex.set(wallet.address, wallet);

            expect(walletIndex.get(wallet.address)).toBe(wallet);
            expect(walletIndex.has(wallet.address)).toBeTrue();

            expect(walletIndex.values()).toContain(wallet);

            walletIndex.clear();
            expect(walletIndex.has(wallet.address)).toBeFalse();
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
            expect(walletIndex.has(wallet.address)).toBeFalse();

            walletIndex.index(wallet);
            expect(walletIndex.has(wallet.address)).toBeTrue();

            walletIndex.forget(wallet.address);
            expect(walletIndex.has(wallet.address)).toBeFalse();
        });

        it("should not throw if key is not indexed", () => {
            walletIndex.forget(wallet.address);
        });
    });

    describe("forgetWallet", () => {
        it("should forget wallet", () => {
            walletIndex.index(wallet);
            expect(walletIndex.get(wallet.address)).toBe(wallet);

            walletIndex.forgetWallet(wallet);
            expect(walletIndex.get(wallet.address)).toBeUndefined();
        });

        it("should not throw if wallet is not indexed", () => {
            walletIndex.forgetWallet(wallet);
        });
    });
});
