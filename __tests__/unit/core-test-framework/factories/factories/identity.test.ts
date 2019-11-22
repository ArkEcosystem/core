import "jest-extended";

import { Interfaces } from "@packages/crypto/src";
import { FactoryBuilder, Factories } from "@packages/core-test-framework/src/factories";

interface Identity {
    keys: Interfaces.IKeyPair;
    publicKey: string;
    privateKey: string;
    address: string;
    wif: string;
    passphrase: string;
    secondPassphrase?: string;
}

let factory: FactoryBuilder;

beforeEach(() => {
    factory = new FactoryBuilder();

    Factories.registerIdentityFactory(factory);
});

describe("IdentityFactory", () => {
    it("should make an identity with a single passphrase", () => {
        const entity: Identity = factory.get("Identity").make<Identity>() as Identity;

        expect(entity).toContainAllKeys(["keys", "publicKey", "privateKey", "address", "wif", "passphrase"]);
        expect(entity.keys).toBeObject();
        expect(entity.keys.publicKey).toBeString();
        expect(entity.keys.privateKey).toBeString();
        expect(entity.publicKey).toBeString();
        expect(entity.privateKey).toBeString();
        expect(entity.address).toBeString();
        expect(entity.wif).toBeString();
        expect(entity.passphrase).toBeString();
    });

    it("should make an identity with a second passphrase", () => {
        const entity: Identity = factory
            .get("Identity")
            .withStates("secondPassphrase")
            .make<Identity>() as Identity;

        expect(entity).toContainAllKeys([
            "keys",
            "publicKey",
            "privateKey",
            "address",
            "wif",
            "passphrase",
            "secondPassphrase",
        ]);
        expect(entity.keys).toBeObject();
        expect(entity.keys.publicKey).toBeString();
        expect(entity.keys.privateKey).toBeString();
        expect(entity.publicKey).toBeString();
        expect(entity.privateKey).toBeString();
        expect(entity.address).toBeString();
        expect(entity.wif).toBeString();
        expect(entity.passphrase).toBeString();
        expect(entity.secondPassphrase).toBeString();
    });
});
