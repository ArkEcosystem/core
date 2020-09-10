import { Enums } from "@arkecosystem/core-magistrate-crypto";
import { Identities, Utils } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";

import * as support from "./__support__";

beforeAll(async () => await support.setUp());
afterAll(async () => await support.tearDown());

describe("Transaction Forging - Entity registration", () => {
    describe("Signed with 1 Passphrase", () => {
        it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
            // Registering all possible entity types/subTypes
            const registrations = [];
            let nonce = Utils.BigNumber.make(2);
            for (const { type, subType, name } of [
                { type: Enums.EntityType.Business, subType: 0, name: "bzness" },
                { type: Enums.EntityType.Delegate, subType: 1, name: "genesis_1" },
                { type: Enums.EntityType.Product, subType: 6, name: "prduct" },
                { type: Enums.EntityType.Plugin, subType: 255, name: "plgincore" },
                { type: Enums.EntityType.Plugin, subType: 134, name: "plgindskt" },
                { type: 255, subType: 134, name: "type255shouldwork" },
                { type: 174, subType: 33, name: "type174shouldwork" },
            ]) {
                registrations.push(
                    TransactionFactory.entity({ type, subType, action: Enums.EntityAction.Register, data: { name } })
                        .withPassphrase(secrets[0])
                        .withNonce(nonce)
                        .createOne(),
                );
                nonce = nonce.plus(1);
            }

            await expect(registrations[0]).not.toBeAccepted(); // aip36 not here yet
            await support.snoozeForBlock(1);
            for (const entityRegistration of registrations) {
                await expect(entityRegistration.id).not.toBeForged();
            }

            for (let i = 0; i < 30; i++) {
                await support.snoozeForBlock(1); // wait for aip36 to kick in, todo better way without waiting ? (snapshot ?)
            }

            await expect(registrations).toBeAllAccepted();
            await support.snoozeForBlock(1);
            for (const entityRegistration of registrations) {
                await expect(entityRegistration.id).toBeForged();
                await expect(entityRegistration).entityRegistered();
            }
        });

        it("should reject entity registration, because entity name contains unicode control characters [Signed with 1 Passphrase]", async () => {
            // entity registration
            const entityRegistration = TransactionFactory.entity({
                type: Enums.EntityType.Plugin,
                subType: 1,
                action: Enums.EntityAction.Register,
                data: {
                    name: "\u0008name",
                },
            })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(entityRegistration).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(entityRegistration.id).not.toBeForged();
            await expect(entityRegistration).not.entityRegistered();
        });

        it("should reject entity registration, because entity type is > 255 [Signed with 1 Passphrase]", async () => {
            // entity registration
            const entityRegistration = TransactionFactory.entity({
                type: 256,
                subType: 1,
                action: Enums.EntityAction.Register,
                data: {
                    name: "name256",
                },
            })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(entityRegistration).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(entityRegistration.id).not.toBeForged();
            await expect(entityRegistration).not.entityRegistered();
        });

        it("should reject entity registration, because entity sub type is > 255 [Signed with 1 Passphrase]", async () => {
            // entity registration
            const entityRegistration = TransactionFactory.entity({
                type: 1,
                subType: 256,
                action: Enums.EntityAction.Register,
                data: {
                    name: "namesubtype256",
                },
            })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(entityRegistration).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(entityRegistration.id).not.toBeForged();
            await expect(entityRegistration).not.entityRegistered();
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

            // Registering entity
            const entityRegistration = TransactionFactory.entity({
                type: Enums.EntityType.Business,
                subType: 0,
                action: Enums.EntityAction.Register,
                data: {
                    name: "my_bizbiz",
                },
            })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(entityRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(entityRegistration.id).toBeForged();
            await expect(entityRegistration).entityRegistered();
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

            // Registering entity
            const entityRegistration = TransactionFactory.entity({
                type: Enums.EntityType.Module,
                subType: 0,
                action: Enums.EntityAction.Register,
                data: {
                    name: "iam_a_module",
                },
            })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(entityRegistration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(entityRegistration.id).toBeForged();
            await expect(entityRegistration).entityRegistered();
        });
    });
});
