import { Container, Database } from "@arkecosystem/core-interfaces";
import { Identities, Utils } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";
import delay from "delay";
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

describe("Transaction Forging - Bridgechain update", () => {
    describe("Signed with 1 Passphrase", () => {
        const bridgechainRegistrationAsset = {
            name: "cryptoProject",
            seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
            genesisHash: "e629fa6598d732768f7c726b4b621285f9c3b85303900aa912017db7617d8bdb",
            bridgechainRepository: "http://www.repository.com/myorg/myrepo",
            bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
            ports: { "@arkecosystem/core-api": 12345 },
        };

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

            // Registering a bridgechain
            const bridgechainRegistration = TransactionFactory.bridgechainRegistration(bridgechainRegistrationAsset)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(bridgechainRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();

            // Updating a bridgechain
            const bridgechainUpdate = TransactionFactory.bridgechainUpdate({
                bridgechainId: bridgechainRegistrationAsset.genesisHash,
                seedNodes: ["1.2.3.4", "1.2.3.5", "192.168.1.0", "131.107.0.89"],
                ports: { "@arkecosystem/core-api": 54321 },
            })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(bridgechainUpdate).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainUpdate.id).toBeForged();

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

        it("should reject bridgechain update, because bridgechain resigned [Signed with 1 Passphrase]", async () => {
            // Updating a bridgechain after resignation
            const bridgechainUpdate = TransactionFactory.bridgechainUpdate({
                bridgechainId: bridgechainRegistrationAsset.genesisHash,
                seedNodes: ["1.2.3.4", "1.2.3.5", "192.168.1.0", "131.107.0.89"],
            })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(bridgechainUpdate).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(bridgechainUpdate.id).not.toBeForged();
        });

        it("should reject bridgechain update, because bridgechain update for same bridgechain is already in the pool [Signed with 1 Passphrase]", async () => {
            // Registering a bridgechain
            const bridgechainRegistrationAsset2 = {
                name: "cryptoProject2",
                seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "b17ef6d19c7a5b1ee83b907c595526dcb1eb06db8227d650d5dda0a9f4ce8cd9",
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
            await support.snoozeForBlock(1);
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
            const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 200 * 1e8)
                .withPassphrase(secrets[2])
                .withNonce(Utils.BigNumber.make(2))
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
                genesisHash: "4523540f1504cd17100c4835e85b7eefd49911580f8efff0599a8f283be6b9e3",
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

            // Update a bridgechain
            const bridgechainUpdate = TransactionFactory.bridgechainUpdate({
                bridgechainId: bridgechainRegistrationAsset.genesisHash,
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
                .withPassphrase(secrets[2])
                .withNonce(Utils.BigNumber.make(3))
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await delay(8000);
            // await support.snoozeForBlock(1);
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
                .withPassphrase(secrets[2])
                .withNonce(Utils.BigNumber.make(4))
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
                genesisHash: "4ec9599fc203d176a301536c2e091a19bc852759b255bd6818810a42c5fed14a",
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

            // Update a bridgechain
            const bridgechainUpdate = TransactionFactory.bridgechainUpdate({
                bridgechainId: bridgechainRegistrationAsset.genesisHash,
                seedNodes: ["1.2.3.4", "1.2.3.5", "192.168.1.0", "131.107.0.89"],
                ports: { "@arkecosystem/core-api": 54321 },
            })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(bridgechainUpdate).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainUpdate.id).toBeForged();
        });
    });

    describe("Apply and revert bridgechain update", () => {
        it("should update bridgechain then revert to previous state when reverting block", async () => {
            // Registering a bridgechain
            const bridgechainRegistrationAsset3 = {
                name: "cryptoProject3",
                seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "c17ef6d19c7a5b1ee83b907c595526dcb1eb06db8227d650d5dda0a9f4ce8cd9",
                bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
                ports: { "@arkecosystem/core-api": 12345 },
            };

            const bridgechainRegistration = TransactionFactory.bridgechainRegistration(bridgechainRegistrationAsset3)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(bridgechainRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();

            const bridgechainUpdateAsset1 = { seedNodes: ["1.2.3.4", "1.2.3.5", "192.168.1.0", "131.107.0.89"] };
            const bridgechainUpdate = TransactionFactory.bridgechainUpdate({
                bridgechainId: bridgechainRegistrationAsset3.genesisHash,
                ...bridgechainUpdateAsset1,
            })
                .withPassphrase(secrets[0])
                .createOne();
            await expect(bridgechainUpdate).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainUpdate.id).toBeForged();

            const bridgechainUpdateAsset2 = { seedNodes: ["1.2.3.4"] };
            const bridgechainUpdate2 = TransactionFactory.bridgechainUpdate({
                bridgechainId: bridgechainRegistrationAsset3.genesisHash,
                ...bridgechainUpdateAsset2,
            })
                .withPassphrase(secrets[0])
                .createOne();
            await expect(bridgechainUpdate2).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(bridgechainUpdate2.id).toBeForged();
            const wallet = databaseService.walletManager.findByPublicKey(
                Identities.PublicKey.fromPassphrase(secrets[0]),
            );
            expect(wallet.getAttribute("business").bridgechains[bridgechainRegistrationAsset3.genesisHash]).toEqual({
                bridgechainAsset: Object.assign(
                    {},
                    bridgechainRegistrationAsset3,
                    bridgechainUpdateAsset1,
                    bridgechainUpdateAsset2,
                ),
            });

            await support.revertLastBlock();
            await support.revertLastBlock();

            expect(wallet.getAttribute("business").bridgechains[bridgechainRegistrationAsset3.genesisHash]).toEqual({
                bridgechainAsset: Object.assign({}, bridgechainRegistrationAsset3, bridgechainUpdateAsset1),
            });
        });
    });
});
