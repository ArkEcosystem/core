import { State } from "@arkecosystem/core-interfaces";
import { Wallet } from "../../../../packages/core-state/src/wallets";
import { WalletIndex } from "../../../../packages/core-state/src/wallets/wallet-index";
import wallets from "../__fixtures__/wallets.json";

const walletData1 = wallets[0];

describe("WalletIndex", () => {
    it("should be ok", () => {
        const wallet = new Wallet(walletData1.address);
        const walletIndex = new WalletIndex((index: State.IWalletIndex, wallet: State.IWallet) => {
            index.set(wallet.address, wallet);
        });

        expect(walletIndex.has(walletData1.address)).toBeFalse();

        walletIndex.index(wallet);
        expect(walletIndex.has(walletData1.address)).toBeTrue();

        walletIndex.forget(walletData1.address);
        expect(walletIndex.has(walletData1.address)).toBeFalse();

        walletIndex.set(walletData1.address, wallet);
        expect(walletIndex.get(walletData1.address)).toBe(wallet);
        expect(walletIndex.has(walletData1.address)).toBeTrue();

        expect(walletIndex.all()).toContain(wallet);

        walletIndex.clear();
        expect(walletIndex.has(walletData1.address)).toBeFalse();
    });
});
