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

describe("Transaction Forging - Business update", () => {
    describe("Signed with 1 Passphrase", () => {
        it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
            // Registering a business
            const businessRegistration = TransactionFactory.initialize(app)
                .businessRegistration({
                    name: "ark",
                    website: "https://ark.io",
                })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();

            // Updating a business
            const businessUpdate = TransactionFactory.initialize(app)
                .businessUpdate({
                    name: "ark2",
                })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(businessUpdate).toBeAccepted();
            await snoozeForBlock(1);
            await expect(businessUpdate.id).toBeForged();
        });

        it("reject business update, because business resigned [Signed with 1 Passphrase]", async () => {
            // Resigning a business
            const businessResignation = TransactionFactory.initialize(app)
                .businessResignation()
                .withPassphrase(secrets[0])
                .createOne();

            await expect(businessResignation).toBeAccepted();
            await snoozeForBlock(1);
            await expect(businessResignation.id).toBeForged();

            // Updating a business
            const businessUpdate = TransactionFactory.initialize(app)
                .businessUpdate({
                    name: "ark3",
                })
                .withPassphrase(secrets[0])
                .createOne();

            expect(businessUpdate).toBeRejected();
            await snoozeForBlock(1);
            await expect(businessUpdate.id).not.toBeForged();
        });

        it("should reject business update, because business update is already in the pool [Signed with 1 Passphrase]", async () => {
            // Registering a business
            const businessRegistration = TransactionFactory.initialize(app)
                .businessRegistration({
                    name: "ark",
                    website: "https://ark.io",
                })
                .withPassphrase(secrets[1])
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();

            // Updating a business
            const businessUpdate = TransactionFactory.initialize(app)
                .businessUpdate({
                    name: "ark2",
                })
                .withPassphrase(secrets[1])
                .createOne();

            const businessUpdate2 = TransactionFactory.initialize(app)
                .businessUpdate({
                    name: "ark2",
                })
                .withPassphrase(secrets[1])
                .withNonce(businessUpdate.nonce.plus(1))
                .createOne();

            await expect([businessUpdate, businessUpdate2]).not.toBeAllAccepted();
            await snoozeForBlock(1);
            await expect(businessUpdate.id).toBeForged();
            await expect(businessUpdate2.id).not.toBeForged();
        });
        it("should reject business update, because updated business name contains unicode control characters [Signed with 1 Passphrase]", async () => {
            // Updating a business
            const businessUpdate = TransactionFactory.initialize(app)
                .businessUpdate({
                    name: "\u0000ark",
                })
                .withPassphrase(secrets[1])
                .createOne();

            await expect(businessUpdate).toBeRejected();
            await snoozeForBlock(1);
            await expect(businessUpdate.id).not.toBeForged();
        });

        it("should reject business update, because updated business name contains disallowed characters [Signed with 1 Passphrase]", async () => {
            // Updating a business
            const businessUpdate = TransactionFactory.initialize(app)
                .businessUpdate({
                    name: "ark:)",
                })
                .withPassphrase(secrets[1])
                .createOne();

            await expect(businessUpdate).toBeRejected();
            await snoozeForBlock(1);
            await expect(businessUpdate.id).not.toBeForged();
        });

        it("should be rejected, because website is not valid uri [Signed with 1 Passphrase]", async () => {
            // Registering a business
            const businessRegistration = TransactionFactory.initialize(app)
                .businessUpdate({
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
                .businessUpdate({
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

    describe("Signed with 2 Passphases", () => {
        // Prepare a fresh wallet for the tests
        const passphrase = generateMnemonic();
        const secondPassphrase = generateMnemonic();

        it("should broadcast, accept and forge it [Signed with 2 Passphrases]", async () => {
            // Initial Funds
            const initialFunds = TransactionFactory.initialize(app)
                .transfer(Identities.Address.fromPassphrase(passphrase), 1000 * 1e8)
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

            // Updating a business
            let businessUpdate = TransactionFactory.initialize(app)
                .businessUpdate({
                    name: "ark2",
                })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(businessUpdate).toBeAccepted();
            await snoozeForBlock(1);
            await expect(businessUpdate.id).toBeForged();

            // Resigning a business
            const businessResignation = TransactionFactory.initialize(app)
                .businessResignation()
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(businessResignation).toBeAccepted();
            await snoozeForBlock(1);
            await expect(businessResignation.id).toBeForged();

            // Reject business update
            businessUpdate = TransactionFactory.initialize(app)
                .businessUpdate({
                    name: "ark3",
                })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(businessUpdate).toBeRejected();
            await snoozeForBlock(1);
            await expect(businessUpdate.id).not.toBeForged();
        });
    });

    describe("Signed with multi signature [3 of 3]", () => {
        // Register a multi signature wallet with defaults
        const passphrase = generateMnemonic();
        const passphrases = [passphrase, secrets[4], secrets[5]];
        const participants = [
            Identities.PublicKey.fromPassphrase(passphrases[0]),
            Identities.PublicKey.fromPassphrase(passphrases[1]),
            Identities.PublicKey.fromPassphrase(passphrases[2]),
        ];

        it("should broadcast, accept and forge it [3-of-3 multisig]", async () => {
            // Funds to register a multi signature wallet
            const initialFunds = TransactionFactory.initialize(app)
                .transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Registering a multi-signature wallet
            const multiSignature = TransactionFactory.initialize(app)
                .multiSignature(participants, 3)
                .withPassphrase(passphrase)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(multiSignature).toBeAccepted();
            await snoozeForBlock(1);
            await expect(multiSignature.id).toBeForged();

            // Send funds to multi signature wallet
            const multiSigAddress = Identities.Address.fromMultiSignatureAsset(multiSignature.asset.multiSignature);
            const multiSigPublicKey = Identities.PublicKey.fromMultiSignatureAsset(multiSignature.asset.multiSignature);

            const multiSignatureFunds = TransactionFactory.initialize(app)
                .transfer(multiSigAddress, 200 * 1e8)
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
                .withPassphraseList(passphrases)
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();

            // Updating a business
            let businessUpdate = TransactionFactory.initialize(app)
                .businessUpdate({
                    name: "ark2",
                })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(businessUpdate).toBeAccepted();
            await snoozeForBlock(1);
            await expect(businessUpdate.id).toBeForged();

            // Resigning a business
            const businessResignation = TransactionFactory.initialize(app)
                .businessResignation()
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(businessResignation).toBeAccepted();
            await snoozeForBlock(1);
            await expect(businessResignation.id).toBeForged();

            // Reject business update
            businessUpdate = TransactionFactory.initialize(app)
                .businessUpdate({
                    name: "ark3",
                })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(businessUpdate).toBeRejected();
            await snoozeForBlock(1);
            await expect(businessUpdate.id).not.toBeForged();
        });
    });
});
