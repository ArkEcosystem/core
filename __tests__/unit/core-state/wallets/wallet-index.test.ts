import { Contracts, Container, Services } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";

import { WalletIndex } from "../../../../packages/core-state/src/wallets/wallet-index";
import wallets from "../__fixtures__/wallets.json";
import { Sandbox } from "@packages/core-test-framework/src";

const walletData1 = wallets[0];

let sandbox: Sandbox;

beforeAll(() => {
    sandbox = new Sandbox();

    sandbox.app
        .bind<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .to(Services.Attributes.AttributeSet)
        .inSingletonScope();
});

const createWallet = (address: string): Contracts.State.Wallet =>
    new Wallets.Wallet(
        address,
        new Services.Attributes.AttributeMap(
            sandbox.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes),
        ),
    );

xdescribe("WalletIndex", () => {
    it("should index and forget wallets", () => {
        const wallet = createWallet(walletData1.address);
        const walletIndex = new WalletIndex((index, wallet) => {
            index.set(wallet.address, wallet);
        });

        expect(walletIndex.has(walletData1.address)).toBeFalse();

        walletIndex.index(wallet);
        expect(walletIndex.has(walletData1.address)).toBeTrue();

        walletIndex.forget(walletData1.address);
        expect(walletIndex.has(walletData1.address)).toBeFalse();
    });

    it("should set and get addresses", () => {
        const wallet = createWallet(walletData1.address);
        const walletIndex = new WalletIndex((index, wallet) => {
            index.set(wallet.address, wallet);
        });

        expect(walletIndex.has(walletData1.address)).toBeFalse();

        walletIndex.index(wallet);
        walletIndex.set(walletData1.address, wallet);

        expect(walletIndex.get(walletData1.address)).toBe(wallet);
        expect(walletIndex.has(walletData1.address)).toBeTrue();

        expect(walletIndex.values()).toContain(wallet);

        walletIndex.clear();
        expect(walletIndex.has(walletData1.address)).toBeFalse();
    })
    
    it("should be cloneable", () => {
        const walletIndex = new WalletIndex((index, wallet) => {
            index.set(wallet.address, wallet);
        });

        const clonedWalletIndex = walletIndex.clone();
        expect(walletIndex).toEqual(clonedWalletIndex);
    });

    it("should return entries", () => {
        const wallet = createWallet(walletData1.address);
        const walletIndex = new WalletIndex((index, wallet) => {
            index.set(wallet.address, wallet);
        });

        walletIndex.index(wallet);
        const entries = walletIndex.entries();
        expect(entries.length).toEqual(1);
        expect(entries[0][0]).toEqual(entries[0][1].address);
        expect(entries[0][0]).toEqual(walletData1.address);
    });

    it("should return keys", () => {
        const wallet = createWallet(walletData1.address);
        const walletIndex = new WalletIndex((index, wallet) => {
            index.set(wallet.address, wallet);
        });

        walletIndex.index(wallet);
        expect(walletIndex.keys()).toContain(walletData1.address);
    });
});