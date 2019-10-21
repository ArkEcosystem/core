import "../../../packages/core-test-framework/src/matchers";

import { Identities, Utils } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";
import { TransactionFactory } from "../../../packages/core-test-framework/src/helpers/transaction-factory";
import { secrets } from "../../../packages/core-test-framework/src/utils/config/delegates.json";
import * as support from "./__support__";

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Bridgechain update", () => {
    describe("Signed with 1 Passphrase", () => {
        it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
            // Registering a business
            const businessRegistration = TransactionFactory.businessRegistration({
                name: "ark",
                website: "ark.io",
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
                bridgechainRepository: "somerepository",
            })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(bridgechainRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();

            // Updating a bridgechain
            let bridgechainUpdate = TransactionFactory.bridgechainUpdate({
                bridgechainId: Utils.BigNumber.ONE,
                seedNodes: ["1.2.3.4", "1.2.3.5", "192.168.1.0", "131.107.0.89"],
            })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(bridgechainUpdate).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainUpdate.id).toBeForged();

            // Bridgechain resignation
            const bridgechainResignation = TransactionFactory.bridgechainResignation("1")
                .withPassphrase(secrets[0])
                .createOne();
            await expect(bridgechainResignation).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainResignation.id).toBeForged();

            // Updating a bridgechain after resignation
            bridgechainUpdate = TransactionFactory.bridgechainUpdate({
                bridgechainId: Utils.BigNumber.ONE,
                seedNodes: ["1.2.3.4", "1.2.3.5", "192.168.1.0", "131.107.0.89"],
            })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(bridgechainUpdate).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(bridgechainUpdate.id).not.toBeForged();
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
                website: "ark.io",
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
                genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                bridgechainRepository: "somerepository",
            })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(bridgechainRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();

            // Update a bridgechian
            const bridgechainUpdate = TransactionFactory.bridgechainUpdate({
                bridgechainId: Utils.BigNumber.make("2"),
                seedNodes: ["1.2.3.4", "1.2.3.5", "192.168.1.0", "131.107.0.89"],
            })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(bridgechainUpdate).toBeAccepted();
            await support.snoozeForBlock(1);
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
                website: "ark.io",
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
                genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                bridgechainRepository: "somerepository",
            })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(bridgechainRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();

            // Update a bridgechian
            const bridgechainUpdate = TransactionFactory.bridgechainUpdate({
                bridgechainId: Utils.BigNumber.make("3"),
                seedNodes: ["1.2.3.4", "1.2.3.5", "192.168.1.0", "131.107.0.89"],
            })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(bridgechainUpdate).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainUpdate.id).toBeForged();
        });
    });
});
