import "@packages/core-test-framework/src/matchers";

import secrets from "@packages/core-test-framework/src/internal/passphrases.json";
import { snoozeForBlock, TransactionFactory } from "@packages/core-test-framework/src/utils";
import { generateMnemonic } from "bip39";

import { CryptoSuite } from "../../../packages/core-crypto";
import { Sandbox } from "../../../packages/core-test-framework/src";
import * as support from "./__support__";

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));

const sandbox: Sandbox = new Sandbox(crypto);

beforeAll(async () => {
    await support.setUp(sandbox, crypto);
});
afterAll(async () => await support.tearDown(sandbox));

describe("Transaction Forging - Business resignation", () => {
    describe("Signed with 1 Passphrase", () => {
        it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
            // Registering a business
            let businessRegistration = TransactionFactory.initialize(crypto, sandbox.app)
                .businessRegistration({
                    name: "ark",
                    website: "https://ark.io",
                })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await snoozeForBlock(crypto.CryptoManager, 1);
            await expect(businessRegistration.id).toBeForged();

            // Resigning a business
            const businessResignation = TransactionFactory.initialize(crypto, sandbox.app)
                .businessResignation()
                .withPassphrase(secrets[0])
                .createOne();

            await expect(businessResignation).toBeAccepted();
            await snoozeForBlock(crypto.CryptoManager, 1);
            await expect(businessResignation.id).toBeForged();

            // Reject a new registration
            businessRegistration = TransactionFactory.initialize(crypto, sandbox.app)
                .businessRegistration({
                    name: "ark",
                    website: "https://ark.io",
                })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(businessRegistration).toBeRejected();
            await snoozeForBlock(crypto.CryptoManager, 1);
            await expect(businessRegistration.id).not.toBeForged();
        });

        it("should reject business resignation, because business resigned [Signed with 1 Passphrase]", async () => {
            const businessResignation = TransactionFactory.initialize(crypto, sandbox.app)
                .businessResignation()
                .businessResignation()
                .withPassphrase(secrets[0])
                .createOne();

            await expect(businessResignation).toBeRejected();
            await snoozeForBlock(crypto.CryptoManager, 1);
            await expect(businessResignation.id).not.toBeForged();
        });

        it("should reject business resignation, because business resignation is already in the pool [Signed with 1 Passphrase]", async () => {
            // Registering a business
            const businessRegistration = TransactionFactory.initialize(crypto, sandbox.app)
                .businessRegistration({
                    name: "ark",
                    website: "https://ark.io",
                })
                .withPassphrase(secrets[1])
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await snoozeForBlock(crypto.CryptoManager, 1);
            await expect(businessRegistration.id).toBeForged();

            const businessResignation = TransactionFactory.initialize(crypto, sandbox.app)
                .businessResignation()
                .withPassphrase(secrets[1])
                .createOne();

            const businessResignation2 = TransactionFactory.initialize(crypto, sandbox.app)
                .businessResignation()
                .withPassphrase(secrets[1])
                .withNonce(businessResignation.nonce.plus(1))
                .createOne();

            await expect([businessResignation, businessResignation2]).not.toBeAllAccepted();
            await snoozeForBlock(crypto.CryptoManager, 1);
            await expect(businessResignation.id).toBeForged();
            await expect(businessResignation2.id).not.toBeForged();
        });
    });

    describe("Signed with 2 Passphrases", () => {
        // Prepare a fresh wallet for the tests
        const passphrase = generateMnemonic();
        const secondPassphrase = generateMnemonic();

        it("should broadcast, accept and forge it [Signed with 2 Passphrases] ", async () => {
            // Initial Funds
            const initialFunds = TransactionFactory.initialize(crypto, sandbox.app)
                .transfer(crypto.CryptoManager.Identities.Address.fromPassphrase(passphrase), 250 * 1e8)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await snoozeForBlock(crypto.CryptoManager, 1);
            await expect(initialFunds.id).toBeForged();

            // Register a second passphrase
            const secondSignature = TransactionFactory.initialize(crypto, sandbox.app)
                .secondSignature(secondPassphrase)
                .withPassphrase(passphrase)
                .createOne();

            await expect(secondSignature).toBeAccepted();
            await snoozeForBlock(crypto.CryptoManager, 1);
            await expect(secondSignature.id).toBeForged();

            // Registering a business
            let businessRegistration = TransactionFactory.initialize(crypto, sandbox.app)
                .businessRegistration({
                    name: "ark",
                    website: "https://ark.io",
                })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await snoozeForBlock(crypto.CryptoManager, 1);
            await expect(businessRegistration.id).toBeForged();

            // Resigning a business
            let businessResignation = TransactionFactory.initialize(crypto, sandbox.app)
                .businessResignation()
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(businessResignation).toBeAccepted();
            await snoozeForBlock(crypto.CryptoManager, 1);
            await expect(businessResignation.id).toBeForged();

            // Reject a second resignation
            businessResignation = TransactionFactory.initialize(crypto, sandbox.app)
                .businessResignation()
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(businessResignation).toBeRejected();
            await snoozeForBlock(crypto.CryptoManager, 1);
            await expect(businessResignation.id).not.toBeForged();

            // Reject a new registration
            businessRegistration = TransactionFactory.initialize(crypto, sandbox.app)
                .businessRegistration({
                    name: "ark",
                    website: "https://ark.io",
                })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(businessRegistration).toBeRejected();
            await snoozeForBlock(crypto.CryptoManager, 1);
            await expect(businessRegistration.id).not.toBeForged();
        });
    });
    describe("Signed with multi signature [3 of 3]", () => {
        // Multi signature wallet data
        const passphrase = generateMnemonic();
        const passphrases = [passphrase, secrets[4], secrets[5]];
        const participants = [
            crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[0]),
            crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[1]),
            crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[2]),
        ];

        it("should broadcast, accept and forge it [3-of-3 multisig]", async () => {
            // Funds to register a multi signature wallet
            const initialFunds = TransactionFactory.initialize(crypto, sandbox.app)
                .transfer(crypto.CryptoManager.Identities.Address.fromPassphrase(passphrase), 50 * 1e8)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await snoozeForBlock(crypto.CryptoManager, 1);
            await expect(initialFunds.id).toBeForged();

            // Registering a multi-signature wallet
            const multiSignature = TransactionFactory.initialize(crypto, sandbox.app)
                .multiSignature(participants, 3)
                .withPassphrase(passphrase)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(multiSignature).toBeAccepted();
            await snoozeForBlock(crypto.CryptoManager, 1);
            await expect(multiSignature.id).toBeForged();

            // Send funds to multi signature wallet
            const multiSigAddress = crypto.CryptoManager.Identities.Address.fromMultiSignatureAsset(
                multiSignature.asset.multiSignature,
            );
            const multiSigPublicKey = crypto.CryptoManager.Identities.PublicKey.fromMultiSignatureAsset(
                multiSignature.asset.multiSignature,
            );

            const multiSignatureFunds = TransactionFactory.initialize(crypto, sandbox.app)
                .transfer(multiSigAddress, 300 * 1e8)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(multiSignatureFunds).toBeAccepted();
            await snoozeForBlock(crypto.CryptoManager, 1);
            await expect(multiSignatureFunds.id).toBeForged();

            // Registering a business
            let businessRegistration = TransactionFactory.initialize(crypto, sandbox.app)
                .businessRegistration({
                    name: "ark",
                    website: "https://ark.io",
                })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await snoozeForBlock(crypto.CryptoManager, 1);
            await expect(businessRegistration.id).toBeForged();

            // Resigning a business
            let businessResignation = TransactionFactory.initialize(crypto, sandbox.app)
                .businessResignation()
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(businessResignation).toBeAccepted();
            await snoozeForBlock(crypto.CryptoManager, 1);
            await expect(businessResignation.id).toBeForged();

            // Reject a second resignation
            businessResignation = TransactionFactory.initialize(crypto, sandbox.app)
                .businessResignation()
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(businessResignation).toBeRejected();
            await snoozeForBlock(crypto.CryptoManager, 1);
            await expect(businessResignation.id).not.toBeForged();

            // Reject a new registration
            businessRegistration = TransactionFactory.initialize(crypto, sandbox.app)
                .businessRegistration({
                    name: "ark",
                    website: "https://ark.io",
                })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(businessRegistration).toBeRejected();
            await snoozeForBlock(crypto.CryptoManager, 1);
            await expect(businessRegistration.id).not.toBeForged();
        });
    });
});
