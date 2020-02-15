import { Container, Database } from "@arkecosystem/core-interfaces";
import { Identities } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

let app: Container.IContainer;
let databaseService: Database.IDatabaseService;

beforeAll(async () => {
    app = await support.setUp();
    databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
});
afterAll(support.tearDown);

describe("Transaction Forging - Business update", () => {
    describe("Signed with 1 Passphrase", () => {
        it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
            // Registering a business
            const businessRegistration = TransactionFactory.businessRegistration({
                name: "ark",
                website: "https://ark.io",
            })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();

            // Updating a business
            const businessUpdate = TransactionFactory.businessUpdate({
                name: "ark2",
            })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(businessUpdate).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessUpdate.id).toBeForged();

            const wallet = databaseService.walletManager.findByPublicKey(
                Identities.PublicKey.fromPassphrase(secrets[0]),
            );
            expect(wallet.getAttribute("business.businessAsset")).toEqual({
                name: "ark2",
                website: "https://ark.io",
            });
        });

        it("should reject business update, because business resigned [Signed with 1 Passphrase]", async () => {
            // Resigning a business
            const businessResignation = TransactionFactory.businessResignation()
                .withPassphrase(secrets[0])
                .createOne();

            await expect(businessResignation).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessResignation.id).toBeForged();

            // Updating a business
            const businessUpdate = TransactionFactory.businessUpdate({
                name: "ark3",
            })
                .withPassphrase(secrets[0])
                .createOne();

            expect(businessUpdate).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(businessUpdate.id).not.toBeForged();
        });

        it("should reject business update, because business update is already in the pool [Signed with 1 Passphrase]", async () => {
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

            // Updating a business
            const businessUpdate = TransactionFactory.businessUpdate({
                name: "ark2",
            })
                .withPassphrase(secrets[1])
                .createOne();

            const businessUpdate2 = TransactionFactory.businessUpdate({
                name: "ark2",
            })
                .withPassphrase(secrets[1])
                .withNonce(businessUpdate.nonce.plus(1))
                .createOne();

            await expect([businessUpdate, businessUpdate2]).not.toBeAllAccepted();
            await support.snoozeForBlock(1);
            await expect(businessUpdate.id).toBeForged();
            await expect(businessUpdate2.id).not.toBeForged();
        });

        it("should reject business update, because updated business name contains unicode control characters [Signed with 1 Passphrase]", async () => {
            // Updating a business
            const businessUpdate = TransactionFactory.businessUpdate({
                name: "\u0000ark",
            })
                .withPassphrase(secrets[1])
                .createOne();

            expect(businessUpdate).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(businessUpdate.id).not.toBeForged();
        });

        it("should reject business update, because updated business name contains disallowed characters [Signed with 1 Passphrase]", async () => {
            // Updating a business
            const businessUpdate = TransactionFactory.businessUpdate({
                name: "ark:)",
            })
                .withPassphrase(secrets[1])
                .createOne();

            expect(businessUpdate).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(businessUpdate.id).not.toBeForged();
        });

        it("should be rejected, because website is not valid uri [Signed with 1 Passphrase]", async () => {
            // Registering a business
            const businessRegistration = TransactionFactory.businessUpdate({
                website: "ark.io",
            })
                .withPassphrase(secrets[2])
                .createOne();

            await expect(businessRegistration).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(businessRegistration.id).not.toBeForged();
        });

        it("should be rejected, because repository is not valid uri [Signed with 1 Passphrase]", async () => {
            // Registering a business
            const businessRegistration = TransactionFactory.businessUpdate({
                name: "ark",
                website: "https://ark.io",
                repository: "http//ark.io/repo",
            })
                .withPassphrase(secrets[3])
                .createOne();

            await expect(businessRegistration).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(businessRegistration.id).not.toBeForged();
        });
    });

    describe("Signed with 2 Passphases", () => {
        // Prepare a fresh wallet for the tests
        const passphrase = generateMnemonic();
        const secondPassphrase = generateMnemonic();

        it("should broadcast, accept and forge it [Signed with 2 Passphrases]", async () => {
            // Initial Funds
            const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 1000 * 1e8)
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
                name: "ark",
                website: "https://ark.io",
            })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();

            // Updating a business
            let businessUpdate = TransactionFactory.businessUpdate({
                name: "ark2",
            })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(businessUpdate).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessUpdate.id).toBeForged();

            // Resigning a business
            const businessResignation = TransactionFactory.businessResignation()
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(businessResignation).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessResignation.id).toBeForged();

            // Reject business update
            businessUpdate = TransactionFactory.businessUpdate({
                name: "ark3",
            })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(businessUpdate).toBeRejected();
            await support.snoozeForBlock(1);
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
            const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
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

            const multiSignatureFunds = TransactionFactory.transfer(multiSigAddress, 200 * 1e8)
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

            // Updating a business
            let businessUpdate = TransactionFactory.businessUpdate({
                name: "ark2",
            })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(businessUpdate).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessUpdate.id).toBeForged();

            // Resigning a business
            const businessResignation = TransactionFactory.businessResignation()
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(businessResignation).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessResignation.id).toBeForged();

            // Reject business update
            businessUpdate = TransactionFactory.businessUpdate({
                name: "ark3",
            })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(businessUpdate).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(businessUpdate.id).not.toBeForged();
        });
    });

    describe("Signed with 1 Passphrase", () => {
        it("should accept the update then revert to previous wallet state on revert block", async () => {
            // Registering a business
            const businessRegistration = TransactionFactory.businessRegistration({
                name: "ark",
                website: "https://ark.io",
            })
                .withPassphrase(secrets[3])
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();

            // Updating a business
            const businessUpdate1 = TransactionFactory.businessUpdate({
                name: "ark2",
            })
                .withPassphrase(secrets[3])
                .createOne();

            await expect(businessUpdate1).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessUpdate1.id).toBeForged();

            const wallet = databaseService.walletManager.findByPublicKey(
                Identities.PublicKey.fromPassphrase(secrets[3]),
            );
            expect(wallet.getAttribute("business.businessAsset")).toEqual({
                name: "ark2",
                website: "https://ark.io",
            });

            // Updating a business
            const businessUpdate2 = TransactionFactory.businessUpdate({
                name: "ark23456",
            })
                .withPassphrase(secrets[3])
                .createOne();

            await expect(businessUpdate2).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(businessUpdate2.id).toBeForged();

            await support.revertLastBlock();
            await support.revertLastBlock();

            expect(wallet.getAttribute("business.businessAsset")).toEqual({
                name: "ark2",
                website: "https://ark.io",
            });
        });
    });
});
