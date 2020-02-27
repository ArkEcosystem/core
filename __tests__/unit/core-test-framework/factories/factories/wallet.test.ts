import "jest-extended";

import { Wallets } from "@arkecosystem/core-state";
import { FactoryBuilder, Factories } from "@packages/core-test-framework/src/factories";

let factory: FactoryBuilder;

beforeEach(() => {
    factory = new FactoryBuilder();

    Factories.registerWalletFactory(factory);
});

describe("WalletFactory", () => {
    it("should make a wallet", () => {
        const entity: Wallets.Wallet = factory.get("Wallet").make<Wallets.Wallet>();

        expect(entity).toBeInstanceOf(Wallets.Wallet);
        expect(entity.address).toBeString();
        expect(entity.publicKey).toBeString();
    });

    it("should make a wallet with a second public key", () => {
        const entity: Wallets.Wallet = factory
            .get("Wallet")
            .withStates("secondPublicKey")
            .make<Wallets.Wallet>();

        expect(entity).toBeInstanceOf(Wallets.Wallet);
        expect(entity.address).toBeString();
        expect(entity.publicKey).toBeString();
        expect(entity.getAttribute("secondPublicKey")).toBeString();
    });
});
