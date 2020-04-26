import "jest-extended";

import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import { Interfaces, Identities } from "@packages/crypto/src";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";

let factory: FactoryBuilder;

beforeEach(() => {
    factory = new FactoryBuilder();

    Factories.registerTransactionFactory(factory);
});

describe("TransactionFactory", () => {
    describe("Transfer", () => {
        it("should create a builder", () => {
            const transaction: Interfaces.ITransaction = factory.get("Transfer").make();

            expect(transaction.data.signature).toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
        });

        it("should create a builder with options", () => {
            let options = {
                version: 2,
                nonce: 1,
                fee: 2,
                timestamp: 1,
                senderPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0]),
                expiration: 2,
                vendorField: "Dummy Field",
            };

            const transaction: Interfaces.ITransaction = factory
                .get("Transfer")
                .withOptions(options)
                .withStates("vendorField")
                .make();

            expect(transaction.data.signature).toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();

            expect(transaction.data.vendorField).toBeDefined();
        });

        it("should create a builder with vendor field", () => {
            const transaction: Interfaces.ITransaction = factory.get("Transfer").withStates("vendorField").make();

            expect(transaction.data.signature).toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();

            expect(transaction.data.vendorField).toBeDefined();
        });

        it("should sign it with a single passphrase", () => {
            const transaction: Interfaces.ITransaction = factory.get("Transfer").withStates("sign").make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with a second passphrase", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("Transfer")
                .withStates("sign", "secondSign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).not.toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with multiple passphrases", () => {
            const transaction: Interfaces.ITransaction = factory.get("Transfer").withStates("sign", "multiSign").make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).not.toBeUndefined();
            // todo: verify multi signatures
            // expect(transaction.verify()).toBeTrue();
        });
    });

    describe("SecondSignature", () => {
        it("should create a signature builder", () => {
            const transaction: Interfaces.ITransaction = factory.get("SecondSignature").make();

            expect(transaction.data.signature).toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
        });

        it("should sign it with a single passphrase", () => {
            const transaction: Interfaces.ITransaction = factory.get("SecondSignature").withStates("sign").make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with a second passphrase", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("SecondSignature")
                .withStates("sign", "secondSign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).not.toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });
    });

    describe("DelegateRegistration", () => {
        it("should create a signature builder", () => {
            const transaction: Interfaces.ITransaction = factory.get("DelegateRegistration").make();

            expect(transaction.data.signature).toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
        });

        it("should sign it with a single passphrase", () => {
            const transaction: Interfaces.ITransaction = factory.get("DelegateRegistration").withStates("sign").make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with a second passphrase", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("DelegateRegistration")
                .withStates("sign", "secondSign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).not.toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });
    });

    describe("DelegateResignation", () => {
        it("should create a signature builder", () => {
            const transaction: Interfaces.ITransaction = factory.get("DelegateResignation").make();

            expect(transaction.data.signature).toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
        });

        it("should sign it with a single passphrase", () => {
            const transaction: Interfaces.ITransaction = factory.get("DelegateResignation").withStates("sign").make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with a second passphrase", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("DelegateResignation")
                .withStates("sign", "secondSign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).not.toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });
    });

    describe("Vote", () => {
        it("should create a builder", () => {
            const transaction: Interfaces.ITransaction = factory.get("Vote").make();

            expect(transaction.data.signature).toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
        });

        it("should sign it with a single passphrase", () => {
            const transaction: Interfaces.ITransaction = factory.get("Vote").withStates("sign").make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with a second passphrase", () => {
            const transaction: Interfaces.ITransaction = factory.get("Vote").withStates("sign", "secondSign").make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).not.toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with multiple passphrases", () => {
            const transaction: Interfaces.ITransaction = factory.get("Vote").withStates("sign", "multiSign").make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).not.toBeUndefined();
        });
    });

    describe("Unvote", () => {
        it("should create a builder", () => {
            const transaction: Interfaces.ITransaction = factory.get("Unvote").make();

            expect(transaction.data.signature).toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
        });

        it("should sign it with a single passphrase", () => {
            const transaction: Interfaces.ITransaction = factory.get("Unvote").withStates("sign").make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with a second passphrase", () => {
            const transaction: Interfaces.ITransaction = factory.get("Unvote").withStates("sign", "secondSign").make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).not.toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with multiple passphrases", () => {
            const transaction: Interfaces.ITransaction = factory.get("Unvote").withStates("sign", "multiSign").make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).not.toBeUndefined();
        });
    });

    describe("MultiSignature", () => {
        it("should create a builder", () => {
            const transaction: Interfaces.ITransaction = factory.get("MultiSignature").make();

            expect(transaction.data.signature).toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
        });

        it("should sign it with multiple passphrases", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("MultiSignature")
                .withStates("multiSign", "sign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).not.toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });
    });

    describe("Ipfs", () => {
        it("should create a builder", () => {
            const transaction: Interfaces.ITransaction = factory.get("Ipfs").make();

            expect(transaction.data.signature).toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
        });

        it("should sign it with a single passphrase", () => {
            const transaction: Interfaces.ITransaction = factory.get("Ipfs").withStates("sign").make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with a second passphrase", () => {
            const transaction: Interfaces.ITransaction = factory.get("Ipfs").withStates("sign", "secondSign").make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).not.toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with multiple passphrases", () => {
            const transaction: Interfaces.ITransaction = factory.get("Ipfs").withStates("sign", "multiSign").make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).not.toBeUndefined();
        });
    });

    describe("HtlcLock", () => {
        it("should create a builder", () => {
            const transaction: Interfaces.ITransaction = factory.get("HtlcLock").make();

            expect(transaction.data.signature).toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
        });

        it("should sign it with a single passphrase", () => {
            const transaction: Interfaces.ITransaction = factory.get("HtlcLock").withStates("sign").make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with a second passphrase", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("HtlcLock")
                .withStates("sign", "secondSign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).not.toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with multiple passphrases", () => {
            const transaction: Interfaces.ITransaction = factory.get("HtlcLock").withStates("sign", "multiSign").make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).not.toBeUndefined();
        });
    });

    describe("HtlcClaim", () => {
        it("should create a builder", () => {
            const transaction: Interfaces.ITransaction = factory.get("HtlcClaim").make();

            expect(transaction.data.signature).toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
        });

        it("should sign it with a single passphrase", () => {
            const transaction: Interfaces.ITransaction = factory.get("HtlcClaim").withStates("sign").make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with a second passphrase", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("HtlcClaim")
                .withStates("sign", "secondSign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).not.toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with multiple passphrases", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("HtlcClaim")
                .withStates("sign", "multiSign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).not.toBeUndefined();
        });
    });

    describe("HtlcRefund", () => {
        it("should create a builder", () => {
            const transaction: Interfaces.ITransaction = factory.get("HtlcRefund").make();

            expect(transaction.data.signature).toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
        });

        it("should sign it with a single passphrase", () => {
            const transaction: Interfaces.ITransaction = factory.get("HtlcRefund").withStates("sign").make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with a second passphrase", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("HtlcRefund")
                .withStates("sign", "secondSign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).not.toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with multiple passphrases", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("HtlcRefund")
                .withStates("sign", "multiSign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).not.toBeUndefined();
        });
    });

    describe("MultiPayment", () => {
        it("should create a builder", () => {
            const transaction: Interfaces.ITransaction = factory.get("MultiPayment").make();

            expect(transaction.data.signature).toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
        });

        it("should sign it with a single passphrase", () => {
            const transaction: Interfaces.ITransaction = factory.get("MultiPayment").withStates("sign").make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with a second passphrase", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("MultiPayment")
                .withStates("sign", "secondSign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).not.toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with multiple passphrases", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("MultiPayment")
                .withStates("sign", "multiSign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).not.toBeUndefined();
        });
    });

    describe("BusinessRegistration", () => {
        it("should create a builder", () => {
            const transaction: Interfaces.ITransaction = factory.get("BusinessRegistration").make();

            expect(transaction.data.signature).toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
        });

        it("should sign it with a single passphrase", () => {
            const transaction: Interfaces.ITransaction = factory.get("BusinessRegistration").withStates("sign").make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with a second passphrase", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("BusinessRegistration")
                .withStates("sign", "secondSign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).not.toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with multiple passphrases", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("BusinessRegistration")
                .withStates("sign", "multiSign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).not.toBeUndefined();
        });
    });

    describe("BusinessResignation", () => {
        it("should create a builder", () => {
            const transaction: Interfaces.ITransaction = factory.get("BusinessResignation").make();

            expect(transaction.data.signature).toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
        });

        it("should sign it with a single passphrase", () => {
            const transaction: Interfaces.ITransaction = factory.get("BusinessResignation").withStates("sign").make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with a second passphrase", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("BusinessResignation")
                .withStates("sign", "secondSign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).not.toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with multiple passphrases", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("BusinessResignation")
                .withStates("sign", "multiSign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).not.toBeUndefined();
        });
    });

    describe("BusinessUpdate", () => {
        it("should create a builder", () => {
            const transaction: Interfaces.ITransaction = factory.get("BusinessUpdate").make();

            expect(transaction.data.signature).toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
        });

        it("should sign it with a single passphrase", () => {
            const transaction: Interfaces.ITransaction = factory.get("BusinessUpdate").withStates("sign").make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with a second passphrase", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("BusinessUpdate")
                .withStates("sign", "secondSign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).not.toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with multiple passphrases", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("BusinessUpdate")
                .withStates("sign", "multiSign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).not.toBeUndefined();
        });
    });

    describe("BridgechainRegistration", () => {
        it("should create a builder", () => {
            const transaction: Interfaces.ITransaction = factory.get("BridgechainRegistration").make();

            expect(transaction.data.signature).toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
        });

        it("should sign it with a single passphrase", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("BridgechainRegistration")
                .withStates("sign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with a second passphrase", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("BridgechainRegistration")
                .withStates("sign", "secondSign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).not.toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with multiple passphrases", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("BridgechainRegistration")
                .withStates("sign", "multiSign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).not.toBeUndefined();
        });
    });

    describe("BridgechainResignation", () => {
        it("should create a builder", () => {
            const transaction: Interfaces.ITransaction = factory.get("BridgechainResignation").make();

            expect(transaction.data.signature).toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
        });

        it("should sign it with a single passphrase", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("BridgechainResignation")
                .withStates("sign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with a second passphrase", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("BridgechainResignation")
                .withStates("sign", "secondSign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).not.toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with multiple passphrases", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("BridgechainResignation")
                .withStates("sign", "multiSign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).not.toBeUndefined();
        });
    });

    describe("BridgechainUpdate", () => {
        it("should create a builder", () => {
            const transaction: Interfaces.ITransaction = factory.get("BridgechainUpdate").make();

            expect(transaction.data.signature).toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
        });

        it("should sign it with a single passphrase", () => {
            const transaction: Interfaces.ITransaction = factory.get("BridgechainUpdate").withStates("sign").make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with a second passphrase", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("BridgechainUpdate")
                .withStates("sign", "secondSign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).not.toBeUndefined();
            expect(transaction.data.signatures).toBeUndefined();
            expect(transaction.verify()).toBeTrue();
        });

        it("should sign it with multiple passphrases", () => {
            const transaction: Interfaces.ITransaction = factory
                .get("BridgechainUpdate")
                .withStates("sign", "multiSign")
                .make();

            expect(transaction.data.signature).not.toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data.signatures).not.toBeUndefined();
        });
    });
});
