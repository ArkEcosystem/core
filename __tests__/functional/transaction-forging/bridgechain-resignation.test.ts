import { Identities } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Bridgechain resignation", () => {
    describe("Signed with 1 Passphrase", () => {
        const bridgechainRegistrationAsset = {
            name: "cryptoProject",
            seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
            genesisHash: "4fc82b26aecb47d2868c4efbe3581732a3e7cbcc6c2efb32062c08170a05eeb8",
            bridgechainRepository: "http://www.repository.com/myorg/myrepo",
            bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
            ports: { "@arkecosystem/core-api": 12345 },
        };

        it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
            // Business registration
            const businessRegistration = TransactionFactory.businessRegistration({
                name: "ark",
                website: "https://ark.io",
            })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();

            // Bridgechain registration
            const bridgechainRegistration = TransactionFactory.bridgechainRegistration(bridgechainRegistrationAsset)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(bridgechainRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();

            // Bridgechain resignation
            const bridgechainResignation = TransactionFactory.bridgechainResignation(
                bridgechainRegistrationAsset.genesisHash,
            )
                .withPassphrase(secrets[0])
                .createOne();

            await expect(bridgechainResignation).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainResignation.id).toBeForged();
        });

        it("should reject bridgechain resignation, because bridgechain resigned [Signed with 1 Passphrase]", async () => {
            const bridgechainResignation = TransactionFactory.bridgechainResignation(
                bridgechainRegistrationAsset.genesisHash,
            )
                .withPassphrase(secrets[0])
                .createOne();

            expect(bridgechainResignation).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(bridgechainResignation.id).not.toBeForged();
        });

        it("should reject bridgechain resignation, because bridgechain resignation for same bridgechain is already in the pool [Signed with 1 Passphrase]", async () => {
            // Bridgechain registration
            const bridgechainRegistrationAsset2 = {
                name: "cryptoProject2",
                seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "6b51d431df5d7f141cbececcf79edf3dd861c3b4069f0b11661a3eefacbba918",
                bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
                ports: { "@arkecosystem/core-api": 12345 },
            };

            const bridgechainRegistration = TransactionFactory.bridgechainRegistration(bridgechainRegistrationAsset2)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(bridgechainRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();

            const bridgechainResignation = TransactionFactory.bridgechainResignation(
                bridgechainRegistrationAsset2.genesisHash,
            )
                .withPassphrase(secrets[0])
                .createOne();

            const bridgechainResignation2 = TransactionFactory.bridgechainResignation(
                bridgechainRegistrationAsset2.genesisHash,
            )
                .withPassphrase(secrets[0])
                .withNonce(bridgechainResignation.nonce.plus(1))
                .createOne();

            await expect([bridgechainResignation, bridgechainResignation2]).not.toBeAllAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainResignation.id).toBeForged();
            await expect(bridgechainResignation2.id).not.toBeForged();
        });
    });

    describe("Signed with 2 Passphrases", () => {
        it("should broadcast, accept and forge it [Signed with 2 Passphrases]", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();
            const secondPassphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 200 * 1e8)
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
            const bridgechainRegistrationAsset = {
                name: "cryptoProject",
                seedNodes: ["2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "3fdba35f04dc8c462986c992bcf875546257113072a909c162f7e470e581e278",
                bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
                ports: { "@arkecosystem/core-api": 12345 },
            };

            const bridgechainRegistration = TransactionFactory.bridgechainRegistration(bridgechainRegistrationAsset)
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(bridgechainRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();

            // Bridgechain resignation
            const bridgechainResignation = TransactionFactory.bridgechainResignation(
                bridgechainRegistrationAsset.genesisHash,
            )
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(bridgechainResignation).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainResignation.id).toBeForged();
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

            const multiSignatureFunds = TransactionFactory.transfer(multiSigAddress, 150 * 1e8)
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
            const bridgechainRegistrationAsset = {
                name: "cryptoProject",
                seedNodes: ["2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
                bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
                ports: { "@arkecosystem/core-api": 12345 },
            };

            const bridgechainRegistration = TransactionFactory.bridgechainRegistration(bridgechainRegistrationAsset)
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(bridgechainRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();

            // Bridgechain resignation
            const bridgechainResignation = TransactionFactory.bridgechainResignation(
                bridgechainRegistrationAsset.genesisHash,
            )
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(bridgechainResignation).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainResignation.id).toBeForged();
        });
    });
});
