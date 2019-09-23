/* tslint:disable:max-line-length no-empty */
import "../../core-database/mocks/core-container";

import { State } from "@arkecosystem/core-interfaces";
import { Utils } from "@arkecosystem/crypto";
import { TempWalletManager, Wallet, WalletManager } from "../../../../packages/core-state/src/wallets";
import wallets from "../__fixtures__/wallets.json";

const walletData1 = wallets[0];

let walletManager: State.IWalletManager;

beforeEach(() => {
    walletManager = new WalletManager();
});

describe("TempWalletManager", () => {
    describe("reindex", () => {
        it("should not affect the original", () => {
            const wallet = new Wallet(walletData1.address);
            walletManager.reindex(wallet);

            const tempWalletManager = walletManager.clone();
            tempWalletManager.reindex(wallet);

            expect(walletManager.findByAddress(wallet.address)).not.toBe(
                tempWalletManager.findByAddress(wallet.address),
            );
        });
    });

    describe("findByAddress", () => {
        it("should return a copy", () => {
            const wallet = new Wallet(walletData1.address);
            walletManager.reindex(wallet);

            const tempWalletManager = walletManager.clone();
            const tempWallet = tempWalletManager.findByAddress(wallet.address);
            tempWallet.balance = Utils.BigNumber.ONE;

            expect(wallet.balance).not.toEqual(tempWallet.balance);
        });
    });

    describe("findByPublickey", () => {
        it("should return a copy", () => {
            const wallet = new Wallet(walletData1.address);
            wallet.publicKey = walletData1.publicKey;
            wallet.balance = Utils.BigNumber.SATOSHI;
            walletManager.reindex(wallet);

            const cloneWalletManager = walletManager.clone();
            const cloneWallet = cloneWalletManager.findByPublicKey(wallet.publicKey);
            cloneWallet.balance = Utils.BigNumber.ONE;

            const tempWalletManager = new TempWalletManager(walletManager);
            const tempWallet = tempWalletManager.findByPublicKey(wallet.publicKey);
            tempWallet.balance = Utils.BigNumber.ZERO;

            expect(wallet.balance).toEqual(Utils.BigNumber.SATOSHI);
            expect(cloneWallet.balance).toEqual(Utils.BigNumber.ONE);
            expect(tempWallet.balance).toEqual(Utils.BigNumber.ZERO);
        });
    });

    describe("findByUsername", () => {
        it("should return a copy", () => {
            const wallet = new Wallet(walletData1.address);
            wallet.setAttribute("delegate", { username: "test" });
            walletManager.reindex(wallet);

            const tempWalletManager = walletManager.clone();
            const tempWallet = tempWalletManager.findByUsername(wallet.getAttribute("delegate.username"));
            tempWallet.balance = Utils.BigNumber.ONE;

            expect(wallet.balance).not.toEqual(tempWallet.balance);
        });
    });

    describe("hasByAddress", () => {
        it("should be ok", () => {
            const wallet = new Wallet(walletData1.address);
            walletManager.reindex(wallet);

            const tempWalletManager = walletManager.clone();
            expect(tempWalletManager.hasByAddress(wallet.address)).toBeTrue();
        });
    });

    describe("hasByPublicKey", () => {
        it("should be ok", () => {
            const wallet = new Wallet(walletData1.address);
            wallet.publicKey = walletData1.publicKey;
            walletManager.reindex(wallet);

            const tempWalletManager = walletManager.clone();
            expect(tempWalletManager.hasByPublicKey(wallet.publicKey)).toBeTrue();
        });
    });

    describe("hasByUsername", () => {
        it("should be ok", () => {
            const wallet = new Wallet(walletData1.address);
            wallet.setAttribute("delegate", { username: "test" });
            walletManager.reindex(wallet);

            const tempWalletManager = walletManager.clone();
            expect(tempWalletManager.hasByUsername(wallet.getAttribute("delegate.username"))).toBeTrue();
        });
    });
});
