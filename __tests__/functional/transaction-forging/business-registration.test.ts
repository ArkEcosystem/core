import "@packages/core-test-framework/src/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { Identities } from "@arkecosystem/crypto";
import secrets from "@packages/core-test-framework/src/internal/passphrases.json";
import { snoozeForBlock, TransactionFactory } from "@packages/core-test-framework/src/utils";
import { generateMnemonic } from "bip39";

import * as support from "./__support__";

let app: Contracts.Kernel.Application;
beforeAll(async () => (app = await support.setUp()));
afterAll(async () => await support.tearDown());

describe("Transaction Forging - Business registration", () => {
    describe("Signed with 1 Passphrase", () => {
        it("should accept, broadcast and forge it [Signed with 1 Passphrase]", async () => {
            const allowed = [
                "My Business",
                "My-Business",
                "My Blockchain-Business",
                "This.is.my.business",
                "My Business Inc.",
            ];

            const businessRegistrations = [];

            // Registering businesses
            for (const [i, name] of allowed.entries()) {
                businessRegistrations.push(
                    TransactionFactory.initialize(app)
                        .businessRegistration({
                            name,
                            website: "http://ark.io",
                        })
                        .withPassphrase(secrets[10 + i])
                        .createOne(),
                );
            }

            await expect(businessRegistrations).toBeEachAccepted();
            await snoozeForBlock(1);
            for (const transaction of businessRegistrations) {
                await expect(transaction.id).toBeForged();
            }
        });

        it("should be rejected, because wallet is already a business [Signed with 1 Passphrase]", async () => {
            // Registering a business again
            const businessRegistration = TransactionFactory.initialize(app)
                .businessRegistration({
                    name: "ark.io",
                    website: "https://ark.io",
                })
                .withPassphrase(secrets[10])
                .createOne();

            await expect(businessRegistration).toBeRejected();
            await snoozeForBlock(1);
            await expect(businessRegistration.id).not.toBeForged();
        });

        it("should be rejected, because name business contains unicode control characters [Signed with 1 Passphrase]", async () => {
            // Registering a business with unicode control characters in its name
            const businessRegistration = TransactionFactory.initialize(app)
                .businessRegistration({
                    name: "\u0000ark",
                    website: "https://ark.io",
                })
                .withPassphrase(secrets[1])
                .createOne();

            await expect(businessRegistration).toBeRejected();
            await snoozeForBlock(1);
            await expect(businessRegistration.id).not.toBeForged();
        });

        it("should be rejected, because business name contains disallowed characters [Signed with 1 Passphrase]", async () => {
            const disallowed = [" business", "business ", "busi  ness", "busi+ness", "busi. ness"];

            const businessRegistrations = [];

            // Business registrations
            for (const name of disallowed) {
                businessRegistrations.push(
                    TransactionFactory.initialize(app)
                        .businessRegistration({
                            name,
                            website: "https://ark.io",
                        })
                        .withPassphrase(secrets[1])
                        .createOne(),
                );
            }

            await expect(businessRegistrations).toBeEachRejected();
            await snoozeForBlock(1);

            for (const transaction of businessRegistrations) {
                await expect(transaction.id).not.toBeForged();
            }
        });

        it("should be rejected, because business registration is already in the pool [Signed with 1 Passphrase]", async () => {
            // Registering a business
            const businessRegistration = TransactionFactory.initialize(app)
                .businessRegistration({
                    name: "ark",
                    website: "https://ark.io",
                })
                .withPassphrase(secrets[1])
                .createOne();

            // Registering a business again
            const businessRegistration2 = TransactionFactory.initialize(app)
                .businessRegistration({
                    name: "ark",
                    website: "https://ark.io",
                })
                .withPassphrase(secrets[1])
                .withNonce(businessRegistration.nonce.plus(1))
                .createOne();

            await expect([businessRegistration, businessRegistration2]).not.toBeAllAccepted();
            await snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();
            await expect(businessRegistration2.id).not.toBeForged();
        });

        it("should be rejected, because website is not valid uri [Signed with 1 Passphrase]", async () => {
            // Registering a business
            const businessRegistration = TransactionFactory.initialize(app)
                .businessRegistration({
                    name: "ark",
                    website: "ark.io",
                })
                .withPassphrase(secrets[2])
                .createOne();

            await expect(businessRegistration).toBeRejected();
            await snoozeForBlock(1);
            await expect(businessRegistration.id).not.toBeForged();
        });

        it("should be rejected, because repository is not valid uri [Signed with 1 Passphrase]", async () => {
            // Registering a business
            const businessRegistration = TransactionFactory.initialize(app)
                .businessRegistration({
                    name: "ark",
                    website: "https://ark.io",
                    repository: "http//ark.io/repo",
                })
                .withPassphrase(secrets[3])
                .createOne();

            await expect(businessRegistration).toBeRejected();
            await snoozeForBlock(1);
            await expect(businessRegistration.id).not.toBeForged();
        });
    });

    describe("Signed with 2 Passphrases", () => {
        // Prepare a fresh wallet for the tests
        const passphrase = generateMnemonic();
        const secondPassphrase = generateMnemonic();

        it("should broadcast, accept and forge it [Signed with 2 Passphrases]", async () => {
            // Initial Funds
            const initialFunds = TransactionFactory.initialize(app)
                .transfer(Identities.Address.fromPassphrase(passphrase), 150 * 1e8)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Register a second passphrase
            const secondSignature = TransactionFactory.initialize(app)
                .secondSignature(secondPassphrase)
                .withPassphrase(passphrase)
                .createOne();

            await expect(secondSignature).toBeAccepted();
            await snoozeForBlock(1);
            await expect(secondSignature.id).toBeForged();

            // Registering a business
            const businessRegistration = TransactionFactory.initialize(app)
                .businessRegistration({
                    name: "ark",
                    website: "https://ark.io",
                })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();
        });

        it("should be rejected, because wallet is already a business [Signed with 2 Passphrases]", async () => {
            // Registering a business again
            const businessRegistration = TransactionFactory.initialize(app)
                .businessRegistration({
                    name: "ark",
                    website: "https://ark.io",
                })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(businessRegistration).toBeRejected();
            await snoozeForBlock(1);
            await expect(businessRegistration.id).not.toBeForged();
        });
    });

    describe("Signed with multi signature [3 of 5]", () => {
        // Multi signature wallet data
        const passphrase = generateMnemonic();
        const registerPassphrases = [passphrase, secrets[1], secrets[2], secrets[3], secrets[4]];
        const signPassphrases = [passphrase, secrets[1], secrets[2]];
        const participants = [
            Identities.PublicKey.fromPassphrase(registerPassphrases[0]),
            Identities.PublicKey.fromPassphrase(registerPassphrases[1]),
            Identities.PublicKey.fromPassphrase(registerPassphrases[2]),
            Identities.PublicKey.fromPassphrase(registerPassphrases[3]),
            Identities.PublicKey.fromPassphrase(registerPassphrases[4]),
        ];
        let multiSigAddress;
        let multiSigPublicKey;
        it("should broadcast, accept and forge it [3 of 5]", async () => {
            // Initial Funds
            const initialFunds = TransactionFactory.initialize(app)
                .transfer(Identities.Address.fromPassphrase(passphrase), 50 * 1e8)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Registering a multi-signature wallet
            const multiSignature = TransactionFactory.initialize(app)
                .multiSignature(participants, 3)
                .withPassphrase(passphrase)
                .withPassphraseList(registerPassphrases)
                .createOne();

            await expect(multiSignature).toBeAccepted();
            await snoozeForBlock(1);
            await expect(multiSignature.id).toBeForged();

            // Send funds to multi signature wallet
            multiSigAddress = Identities.Address.fromMultiSignatureAsset(multiSignature.asset.multiSignature);
            multiSigPublicKey = Identities.PublicKey.fromMultiSignatureAsset(multiSignature.asset.multiSignature);

            const multiSignatureFunds = TransactionFactory.initialize(app)
                .transfer(multiSigAddress, 100 * 1e8)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(multiSignatureFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(multiSignatureFunds.id).toBeForged();

            // Registering a business
            const businessRegistration = TransactionFactory.initialize(app)
                .businessRegistration({
                    name: "ark",
                    website: "https://ark.io",
                })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(signPassphrases)
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();
        });

        it("should be rejected, because wallet is already a business [3 of 5]", async () => {
            // Registering a business again
            const businessRegistration = TransactionFactory.initialize(app)
                .businessRegistration({
                    name: "ark",
                    website: "https://ark.io",
                })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(signPassphrases)
                .createOne();

            await expect(businessRegistration).toBeRejected();
            await snoozeForBlock(1);
            await expect(businessRegistration.id).not.toBeForged();
        });
    });
});
