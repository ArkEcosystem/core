import { Identities } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Business resignation", () => {
    describe("Signed with 1 Passphrase", () => {
        it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
            // Registering a business
            let businessRegistration = TransactionFactory.businessRegistration({
                name: "ark",
                website: "https://ark.io",
            })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();

            // Resigning a business
            const businessResignation = TransactionFactory.businessResignation()
                .withPassphrase(secrets[0])
                .createOne();

            await expect(businessResignation).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessResignation.id).toBeForged();

            // Reject a new registration
            businessRegistration = TransactionFactory.businessRegistration({
                name: "ark",
                website: "https://ark.io",
            })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(businessRegistration).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(businessRegistration.id).not.toBeForged();
        });

        it("should reject business resignation, because business resigned [Signed with 1 Passphrase]", async () => {
            const businessResignation = TransactionFactory.businessResignation()
                .withPassphrase(secrets[0])
                .createOne();

            await expect(businessResignation).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(businessResignation.id).not.toBeForged();
        });

        it("should reject business resignation, because business resignation is already in the pool [Signed with 1 Passphrase]", async () => {
            // Registering a business
            const businessRegistration = TransactionFactory.businessRegistration({
                name: "ark",
                website: "https://ark.io",
            })
                .withPassphrase(secrets[1])
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();

            const businessResignation = TransactionFactory.businessResignation()
                .withPassphrase(secrets[1])
                .createOne();

            const businessResignation2 = TransactionFactory.businessResignation()
                .withPassphrase(secrets[1])
                .withNonce(businessResignation.nonce.plus(1))
                .createOne();

            await expect([businessResignation, businessResignation2]).not.toBeAllAccepted();
            await support.snoozeForBlock(1);
            await expect(businessResignation.id).toBeForged();
            await expect(businessResignation2.id).not.toBeForged();
        });

        it("should reject business resignation, because bridgechain is not resigned [Signed with 1 Passphrase]", async () => {
            // Registering a business
            const businessRegistration = TransactionFactory.businessRegistration({
                name: "ark",
                website: "https://ark.io",
            })
                .withPassphrase(secrets[2])
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();

            const bridgechainRegistration = TransactionFactory.bridgechainRegistration({
                name: "cryptoProject2",
                seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35",
                bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
                ports: { "@arkecosystem/core-api": 12345 },
            })
                .withPassphrase(secrets[2])
                .createOne();

            await expect(bridgechainRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();

            const businessResignation = TransactionFactory.businessResignation()
                .withPassphrase(secrets[2])
                .createOne();

            await expect(businessResignation).not.toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessResignation.id).not.toBeForged();
        });
    });

    describe("Signed with 2 Passphrases", () => {
        // Prepare a fresh wallet for the tests
        const passphrase = generateMnemonic();
        const secondPassphrase = generateMnemonic();

        it("should broadcast, accept and forge it [Signed with 2 Passphrases] ", async () => {
            // Initial Funds
            const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 250 * 1e8)
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
            let businessRegistration = TransactionFactory.businessRegistration({
                name: "ark",
                website: "https://ark.io",
            })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();

            // Resigning a business
            let businessResignation = TransactionFactory.businessResignation()
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(businessResignation).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessResignation.id).toBeForged();

            // Reject a second resignation
            businessResignation = TransactionFactory.businessResignation()
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(businessResignation).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(businessResignation.id).not.toBeForged();

            // Reject a new registration
            businessRegistration = TransactionFactory.businessRegistration({
                name: "ark",
                website: "https://ark.io",
            })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(businessRegistration).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(businessRegistration.id).not.toBeForged();
        });
    });
    describe("Signed with multi signature [3 of 3]", () => {
        // Multi signature wallet data
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

            const multiSignatureFunds = TransactionFactory.transfer(multiSigAddress, 300 * 1e8)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(multiSignatureFunds).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(multiSignatureFunds.id).toBeForged();

            // Registering a business
            let businessRegistration = TransactionFactory.businessRegistration({
                name: "ark",
                website: "https://ark.io",
            })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();

            // Resigning a business
            let businessResignation = TransactionFactory.businessResignation()
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(businessResignation).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessResignation.id).toBeForged();

            // Reject a second resignation
            businessResignation = TransactionFactory.businessResignation()
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(businessResignation).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(businessResignation.id).not.toBeForged();

            // Reject a new registration
            businessRegistration = TransactionFactory.businessRegistration({
                name: "ark",
                website: "https://ark.io",
            })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(businessRegistration).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(businessRegistration.id).not.toBeForged();
        });
    });
});
