import "jest-extended";

import { Wallets } from "@packages/core-state";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import { Utils } from "@packages/crypto";

let factory: FactoryBuilder;

beforeEach(() => {
    factory = new FactoryBuilder();

    Factories.registerRoundFactory(factory);
});

describe("RoundFactory", () => {
    it("should create a round with delegates", () => {
        const entity: Wallets.Wallet[] = factory.get("Round").make();

        expect(entity).toBeInstanceOf(Array);
        expect(entity.length).toBeGreaterThan(0);

        entity.forEach((delegate) => {
            expect(delegate).toBeInstanceOf(Wallets.Wallet);
            expect(delegate.address).toBeString();
            expect(delegate.publicKey).toBeString();
            expect(delegate.balance).toBeInstanceOf(Utils.BigNumber);
            expect(delegate.nonce).toBeInstanceOf(Utils.BigNumber);
            expect(delegate.isDelegate()).toBeTrue();
        })
    });
});
