import { Container, Services } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";

import { WalletIndex } from "../../../../packages/core-state/src/wallets/wallet-index";
import { FactoryBuilder, Factories } from "@packages/core-test-framework/src/factories";
import { Sandbox } from "@packages/core-test-framework/src";

let sandbox: Sandbox;
let factory: FactoryBuilder;
let wallet: Wallets.Wallet;
let walletIndex: WalletIndex;

beforeAll(() => {
    sandbox = new Sandbox();

    sandbox.app
        .bind<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .to(Services.Attributes.AttributeSet)
        .inSingletonScope();

    factory = new FactoryBuilder();

    Factories.registerWalletFactory(factory);
});

beforeEach(() => {
    wallet = factory.get("Wallet").make<Wallets.Wallet>();
    walletIndex = new WalletIndex((index, wallet) => {
        index.set(wallet.address, wallet);
    });
});

describe("WalletIndex", () => {
    it("should index and forget wallets", () => {
        expect(walletIndex.has(wallet.address)).toBeFalse();

        walletIndex.index(wallet);
        expect(walletIndex.has(wallet.address)).toBeTrue();

        walletIndex.forget(wallet.address);
        expect(walletIndex.has(wallet.address)).toBeFalse();
    });

    it("should set and get addresses", () => {
        expect(walletIndex.has(wallet.address)).toBeFalse();

        walletIndex.index(wallet);
        walletIndex.set(wallet.address, wallet);

        expect(walletIndex.get(wallet.address)).toBe(wallet);
        expect(walletIndex.has(wallet.address)).toBeTrue();

        expect(walletIndex.values()).toContain(wallet);

        walletIndex.clear();
        expect(walletIndex.has(wallet.address)).toBeFalse();
    })
    
    it("should be cloneable", () => {
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
});