import "@packages/core-test-framework/src/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { Identities, Utils } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";

import { snoozeForBlock, TransactionFactory } from "@packages/core-test-framework/src/utils";
import secrets from "@packages/core-test-framework/src/internal/secrets.json";
import * as support from "./__support__";

let app: Contracts.Kernel.Application;
beforeAll(async () => (app = await support.setUp()));
afterAll(async () => await support.tearDown());

describe("Transaction Forging - Bridgechain update", () => {
    describe("Signed with 1 Passphrase", () => {
        const bridgechainRegistrationAsset = {
            name: "cryptoProject",
            seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
            genesisHash: "e629fa6598d732768f7c726b4b621285f9c3b85303900aa912017db7617d8bdb",
            bridgechainRepository: "http://www.repository.com/myorg/myrepo",
        };

        it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
            // Registering a business
            const businessRegistration = TransactionFactory.init(app)
                .businessRegistration({
                    name: "ark",
                    website: "https://ark.io",
                })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();

            // Registering a bridgechain
            const bridgechainRegistration = TransactionFactory.init(app)
                .bridgechainRegistration(bridgechainRegistrationAsset)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(bridgechainRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();

            // Updating a bridgechain
            const bridgechainUpdate = TransactionFactory.init(app)
                .bridgechainUpdate({
                    bridgechainId: bridgechainRegistrationAsset.genesisHash,
                    seedNodes: ["1.2.3.4", "1.2.3.5", "192.168.1.0", "131.107.0.89"],
                })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(bridgechainUpdate).toBeAccepted();
            await snoozeForBlock(1);
            await expect(bridgechainUpdate.id).toBeForged();

            // Bridgechain resignation
            const bridgechainResignation = TransactionFactory.init(app)
                .bridgechainResignation(bridgechainRegistrationAsset.genesisHash)
                .withPassphrase(secrets[0])
                .createOne();
            await expect(bridgechainResignation).toBeAccepted();
            await snoozeForBlock(1);
            await expect(bridgechainResignation.id).toBeForged();
        });

        it("should reject bridgechain update, because bridgechain resigned [Signed with 1 Passphrase]", async () => {
            // Updating a bridgechain after resignation
            const bridgechainUpdate = TransactionFactory.init(app)
                .bridgechainUpdate({
                    bridgechainId: bridgechainRegistrationAsset.genesisHash,
                    seedNodes: ["1.2.3.4", "1.2.3.5", "192.168.1.0", "131.107.0.89"],
                })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(bridgechainUpdate).toBeRejected();
            await snoozeForBlock(1);
            await expect(bridgechainUpdate.id).not.toBeForged();
        });


        it("should reject bridgechain update, because bridgechain update for same bridgechain is already in the pool [Signed with 1 Passphrase]", async () => {
            // Registering a bridgechain
            const bridgechainRegistrationAsset2 = {
                name: "cryptoProject2",
                seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                bridgechainRepository: "http://www.repository.com/myorg/myrepo",
            };

            const bridgechainRegistration = TransactionFactory.init(app)
                .bridgechainRegistration(bridgechainRegistrationAsset2)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(bridgechainRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();

            const bridgechainUpdate = TransactionFactory.bridgechainUpdate({
                bridgechainId: bridgechainRegistrationAsset2.genesisHash,
                seedNodes: ["1.2.3.4", "1.2.3.5", "192.168.1.0", "131.107.0.89"],
            })
                .withPassphrase(secrets[0])
                .createOne();

            const bridgechainUpdate2 = TransactionFactory.bridgechainUpdate({
                bridgechainId: bridgechainRegistrationAsset2.genesisHash,
                seedNodes: ["1.2.3.4", "1.2.3.5", "192.168.1.0", "131.107.0.89"],
            })
                .withPassphrase(secrets[0])
                .withNonce(bridgechainUpdate.nonce.plus(1))
                .createOne();

            await expect([bridgechainUpdate, bridgechainUpdate2]).not.toBeAllAccepted();
            await snoozeForBlock(1);
            await expect(bridgechainUpdate.id).toBeForged();
            await expect(bridgechainUpdate2.id).not.toBeForged();
        });
    });

    describe("Signed with 2 Passphrases", () => {
        it("should broadcast, accept and forge it [Signed with 2 Passphrases]", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();
            const secondPassphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.init(app)
                .transfer(Identities.Address.fromPassphrase(passphrase), 200 * 1e8)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Register a second passphrase
            const secondSignature = TransactionFactory.init(app)
                .secondSignature(secondPassphrase)
                .withPassphrase(passphrase)
                .createOne();

            await expect(secondSignature).toBeAccepted();
            await snoozeForBlock(1);
            await expect(secondSignature.id).toBeForged();

            // Registering a business
            const businessRegistration = TransactionFactory.init(app)
                .businessRegistration({
                    name: "arkecosystem",
                    website: "https://ark.io",
                })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();

            // Registering a bridgechain
            const bridgechainRegistrationAsset = {
                name: "cryptoProject",
                seedNodes: ["2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                bridgechainRepository: "http://www.repository.com/myorg/myrepo",
            };

            const bridgechainRegistration = TransactionFactory.init(app)
                .bridgechainRegistration(bridgechainRegistrationAsset)
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(bridgechainRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();

            // Update a bridgechian
            const bridgechainUpdate = TransactionFactory.init(app)
                .bridgechainUpdate({
                    bridgechainId: bridgechainRegistrationAsset.genesisHash,
                    seedNodes: ["1.2.3.4", "1.2.3.5", "192.168.1.0", "131.107.0.89"],
                })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(bridgechainUpdate).toBeAccepted();
            await snoozeForBlock(1);
            await expect(bridgechainUpdate.id).toBeForged();
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
            const initialFunds = TransactionFactory.init(app)
                .transfer(Identities.Address.fromPassphrase(passphrase), 50 * 1e8)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Registering a multi-signature wallet
            const multiSignature = TransactionFactory.init(app)
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

            const multiSignatureFunds = TransactionFactory.init(app)
                .transfer(multiSigAddress, 150 * 1e8)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(multiSignatureFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(multiSignatureFunds.id).toBeForged();

            // Registering a business
            const businessRegistration = TransactionFactory.init(app)
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

            // Registering a bridgechain
            const bridgechainRegistrationAsset = {
                name: "cryptoProject",
                seedNodes: ["2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                bridgechainRepository: "http://www.repository.com/myorg/myrepo",
            };

            const bridgechainRegistration = TransactionFactory.init(app)
                .bridgechainRegistration(bridgechainRegistrationAsset)
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(bridgechainRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();

            // Update a bridgechian
            const bridgechainUpdate = TransactionFactory.init(app)
                .bridgechainUpdate({
                    bridgechainId: bridgechainRegistrationAsset.genesisHash,
                    seedNodes: ["1.2.3.4", "1.2.3.5", "192.168.1.0", "131.107.0.89"],
                })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(bridgechainUpdate).toBeAccepted();
            await snoozeForBlock(1);
            await expect(bridgechainUpdate.id).toBeForged();
        });
    });
});
