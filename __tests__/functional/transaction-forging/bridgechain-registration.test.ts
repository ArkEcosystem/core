import { Identities } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Bridgechain registration", () => {
    describe("Signed with 1 Passphrase", () => {
        it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
            // Registering a business
            const businessRegistration = TransactionFactory.businessRegistration({
                name: "arkecosystem",
                website: "https://ark.io",
            })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();

            // Registering a bridgechain
            const bridgechainRegistration = TransactionFactory.bridgechainRegistration({
                name: "cryptoProject",
                seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
                ports: { "@arkecosystem/core-api": 12345 },
            })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(bridgechainRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();
        });

        it("should reject bridgechain registration, because bridgechain registration with same name is already in the pool [Signed with 1 Passphrase]", async () => {
            // Registering a bridgechain
            const bridgechainRegistration = TransactionFactory.bridgechainRegistration({
                name: "cryptoProject2",
                seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
                bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
                ports: { "@arkecosystem/core-api": 12345 },
            })
                .withPassphrase(secrets[0])
                .createOne();

            const bridgechainRegistration2 = TransactionFactory.bridgechainRegistration({
                name: "cryptoProject2",
                seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35",
                bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
                ports: { "@arkecosystem/core-api": 12345 },
            })
                .withPassphrase(secrets[0])
                .withNonce(bridgechainRegistration.nonce.plus(1))
                .createOne();

            await expect([bridgechainRegistration, bridgechainRegistration2]).not.toBeAllAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();
            await expect(bridgechainRegistration2.id).not.toBeForged();
        });

        it("should reject bridgechain registration, because bridgechain with same name is already registered (case insensitive) [Signed with 1 Passphrase]", async () => {
            // Bridgechain registration
            const bridgechainRegistration = TransactionFactory.bridgechainRegistration({
                name: "CRYPTOPROJECT",
                seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
                bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
                ports: { "@arkecosystem/core-api": 12345 },
            })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(bridgechainRegistration).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(bridgechainRegistration.id).not.toBeForged();
        });

        it("should reject bridgechain registration, because bridgechain name contains unicode control characters [Signed with 1 Passphrase]", async () => {
            // Bridgechain registration
            const bridgechainRegistration = TransactionFactory.bridgechainRegistration({
                name: "\u0008mybridgechain",
                seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
                bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
                ports: { "@arkecosystem/core-api": 12345 },
            })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(bridgechainRegistration).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(bridgechainRegistration.id).not.toBeForged();
        });

        it("should reject bridgechain registration, because bridgechain with same genesisHash is already registered [Signed with 1 Passphrase]", async () => {
            // Business registration
            const businessRegistration = TransactionFactory.businessRegistration({
                name: "arkecosystem1",
                website: "https://ark.io",
            })
                .withPassphrase(secrets[1])
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();

            // Bridgechain registration
            const bridgechainRegistration = TransactionFactory.bridgechainRegistration({
                name: "MyBridgechain",
                seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "83cf8b609de60036a8277bd0e96135751bbc07eb234256d4b65b893360651bf2",
                bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
                ports: { "@arkecosystem/core-api": 12345 },
            })
                .withPassphrase(secrets[1])
                .createOne();

            await expect(bridgechainRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();

            // Second business registration
            const businessRegistration2 = TransactionFactory.businessRegistration({
                name: "arkecosystem2",
                website: "https://ark.io",
            })
                .withPassphrase(secrets[2])
                .createOne();

            await expect(businessRegistration2).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessRegistration2.id).toBeForged();

            // Second bridgechain registration with the same genesisHash
            const bridgechainRegistration2 = TransactionFactory.bridgechainRegistration({
                name: "MyOtherBridgechain",
                seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "83cf8b609de60036a8277bd0e96135751bbc07eb234256d4b65b893360651bf2",
                bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
                ports: { "@arkecosystem/core-api": 12345 },
            })
                .withPassphrase(secrets[2])
                .withNonce(bridgechainRegistration.nonce.plus(1))
                .createOne();

            await expect(bridgechainRegistration2).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(bridgechainRegistration2.id).not.toBeForged();
        });

        it("should reject bridgechain registration, because bridgechain name contains disallowed characters [Signed with 1 Passphrase]", async () => {
            const disallowed = [" bridgechain", "bridgechain ", "bridge  chain", "bridgech@in"];

            const bridgechainRegistrations = [];

            // Bridgechain registrations
            for (const [i, name] of disallowed.entries()) {
                bridgechainRegistrations.push(
                    TransactionFactory.bridgechainRegistration({
                        name,
                        seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                        genesisHash: `ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39${i}`,
                        bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                        bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
                        ports: { "@arkecosystem/core-api": 12345 },
                    })
                        .withPassphrase(secrets[0])
                        .createOne(),
                );
            }

            await expect(bridgechainRegistrations).toBeEachRejected();
            await support.snoozeForBlock(1);

            for (const transaction of bridgechainRegistrations) {
                await expect(transaction.id).not.toBeForged();
            }
        });

        it("should reject bridgechain registration, because business resigned [Signed with 1 Passphrase]", async () => {
            // first resign bridgechains
            const bridgechainResignation1 = TransactionFactory.bridgechainResignation(
                "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
            )
                .withPassphrase(secrets[0])
                .createOne();
            await expect(bridgechainResignation1).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainResignation1.id).toBeForged();

            const bridgechainResignation2 = TransactionFactory.bridgechainResignation(
                "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
            )
                .withPassphrase(secrets[0])
                .createOne();
            await expect(bridgechainResignation2).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainResignation2.id).toBeForged();

            // Business resignation
            const businessResignation = TransactionFactory.businessResignation()
                .withPassphrase(secrets[0])
                .createOne();

            await expect(businessResignation).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessResignation.id).toBeForged();

            // Bridgechain registration
            const bridgechainRegistration = TransactionFactory.bridgechainRegistration({
                name: "cryptoProject",
                seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "e7f6c011776e8db7cd330b54174fd76f7d0216b612387a5ffcfb81e6f0919683",
                bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
                ports: { "@arkecosystem/core-api": 12345 },
            })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(bridgechainRegistration).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(bridgechainRegistration.id).not.toBeForged();
        });

        it("should reject bridgechain registration, because bridgechainRepository is invalid uri [Signed with 1 Passphrase]", async () => {
            // Business registration
            const businessRegistration = TransactionFactory.businessRegistration({
                name: "arkecosystem",
                website: "https://ark.io",
            })
                .withPassphrase(secrets[5])
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();

            // Bridgechain registration
            const bridgechainRegistration = TransactionFactory.bridgechainRegistration({
                name: "cryptoProject",
                seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "7902699be42c8a8e46fbbb4501726517e86b22c56a189f7625a6da49081b2451",
                bridgechainRepository: "repository.com/myorg/myrepo",
                bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
                ports: { "@arkecosystem/core-api": 12345 },
            })
                .withPassphrase(secrets[5])
                .createOne();

            await expect(bridgechainRegistration).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(bridgechainRegistration.id).not.toBeForged();
        });
    });

    describe("Signed with 2 Passphrases", () => {
        it("should broadcast, accept and forge it [Signed with 2 Passphrases] ", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();
            const secondPassphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 150 * 1e8)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Register a second passphrase
            const secondSignature = TransactionFactory.secondSignature(secondPassphrase)
                .withPassphrase(passphrase)
                .createOne();

            await expect(secondSignature).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(secondSignature.id).toBeForged();

            // Registering a business
            const businessRegistration = TransactionFactory.businessRegistration({
                name: "arkecosystem",
                website: "https://ark.io",
            })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();

            // Registering a bridgechain
            const bridgechainRegistration = TransactionFactory.bridgechainRegistration({
                name: "cryptoProject",
                seedNodes: ["2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "2c624232cdd221771294dfbb310aca000a0df6ac8b66b696d90ef06fdefb64a3",
                bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                // no bridgechainAssetRepository on purpose as it is optional
                ports: { "@arkecosystem/core-api": 12345 },
            })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(bridgechainRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();
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
            const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 50 * 1e8)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Registering a multi-signature wallet
            const multiSignature = TransactionFactory.multiSignature(participants, 3)
                .withPassphrase(passphrase)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(multiSignature).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(multiSignature.id).toBeForged();

            // Send funds to multi signature wallet
            const multiSigAddress = Identities.Address.fromMultiSignatureAsset(multiSignature.asset.multiSignature);
            const multiSigPublicKey = Identities.PublicKey.fromMultiSignatureAsset(multiSignature.asset.multiSignature);

            const multiSignatureFunds = TransactionFactory.transfer(multiSigAddress, 100 * 1e8)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(multiSignatureFunds).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(multiSignatureFunds.id).toBeForged();

            // Registering a business
            const businessRegistration = TransactionFactory.businessRegistration({
                name: "ark",
                website: "https://ark.io",
            })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();

            // Registering a bridgechain
            const bridgechainRegistration = TransactionFactory.bridgechainRegistration({
                name: "cryptoProject",
                seedNodes: ["2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "19581e27de7ced00ff1ce50b2047e7a567c76b1cbaebabe5ef03f7c3017bb5b7",
                bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
                ports: { "@arkecosystem/core-api": 12345 },
            })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(bridgechainRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();
        });
    });
});
