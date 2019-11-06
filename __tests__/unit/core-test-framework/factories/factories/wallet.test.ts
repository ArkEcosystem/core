import "jest-extended";

import { FactoryBuilder, Factories } from "@packages/core-test-framework/src/factories";

interface Wallet {
    address: string;
    publicKey: string;
    privateKey: string;
    wif: string;
    passphrase: string;
    secondPassphrase?: string;
}

let factory: FactoryBuilder;

beforeEach(() => {
    factory = new FactoryBuilder();

    Factories.registerWalletFactory(factory);
});

describe("Factory", () => {
    it("should make a wallet with a single passphrase", () => {
        const entity: Wallet = factory.get("Wallet").make<Wallet>() as Wallet;

        expect(entity).toContainAllKeys(["address", "publicKey", "privateKey", "wif", "passphrase"]);
        expect(entity.address).toBeString();
        expect(entity.publicKey).toBeString();
        expect(entity.privateKey).toBeString();
        expect(entity.wif).toBeString();
        expect(entity.passphrase).toBeString();
    });

    it("should make a wallet with a second passphrase", () => {
        const entity: Wallet = factory
            .get("Wallet")
            .withStates("secondPassphrase")
            .make<Wallet>() as Wallet;

        expect(entity).toContainAllKeys([
            "address",
            "publicKey",
            "privateKey",
            "wif",
            "passphrase",
            "secondPassphrase",
        ]);
        expect(entity.address).toBeString();
        expect(entity.publicKey).toBeString();
        expect(entity.privateKey).toBeString();
        expect(entity.wif).toBeString();
        expect(entity.passphrase).toBeString();
        expect(entity.secondPassphrase).toBeString();
    });
});
