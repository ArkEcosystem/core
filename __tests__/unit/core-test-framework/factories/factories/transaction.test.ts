import "jest-extended";

import { FactoryBuilder, Factories } from "@packages/core-test-framework/src/factories";

let factory: FactoryBuilder;

beforeEach(() => {
    factory = new FactoryBuilder();

    Factories.registerTransactionFactory(factory);
});

describe("TransactionFactory", () => {
    describe("Transfer", () => {
        it("should create a transfer builder", () => {
            const { data } = factory.get("Transfer").make();

            expect(data.signature).toBeUndefined();
            expect(data.secondSignature).toBeUndefined();
            expect(data.signatures).toBeUndefined();
        });

        it("should create a transfer that is signed with a single passphrase", () => {
            const { data } = factory
                .get("Transfer")
                .withStates("sign")
                .make();

            expect(data.signature).not.toBeUndefined();
            expect(data.secondSignature).toBeUndefined();
            expect(data.signatures).toBeUndefined();
        });

        it("should create a transfer that is signed with a second passphrase", () => {
            const { data } = factory
                .get("Transfer")
                .withStates("sign", "secondSign")
                .make();

            expect(data.signature).not.toBeUndefined();
            expect(data.secondSignature).not.toBeUndefined();
            expect(data.signatures).toBeUndefined();
        });

        it("should create a transfer that is signed with multiple passphrase", () => {
            const { data } = factory
                .get("Transfer")
                .withStates("sign", "multiSign")
                .make();

            expect(data.signature).not.toBeUndefined();
            expect(data.secondSignature).toBeUndefined();
            expect(data.signatures).not.toBeUndefined();
        });
    });
});
