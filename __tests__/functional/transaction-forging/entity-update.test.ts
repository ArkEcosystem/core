import "@arkecosystem/core-test-framework/src/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import secrets from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { snoozeForBlock, TransactionFactory } from "@arkecosystem/core-test-framework/src/utils";

import * as support from "./__support__";
import { Enums } from "@arkecosystem/core-magistrate-crypto";
import { Identities } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";

let app: Contracts.Kernel.Application;
beforeAll(async () => (app = await support.setUp()));
afterAll(async () => await support.tearDown());

describe("Transaction Forging - Entity update", () => {
    const staticFeeUpdate = 500000000;
    const subType = 9; // subType is valid between 0 and 255
    const type = 255; // type is valid between 0 and 255
    describe("Signed with 1 Passphrase", () => {
        it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
            for (let i = 0; i < 30; i++) {
                await snoozeForBlock(1); // wait for aip36 to kick in, todo better way without waiting ? (snapshot ?)
            }

            // Registering a desktop wallet plugin
            const entityRegistration = TransactionFactory.initialize(app)
                .entity({
                    type,
                    subType,
                    action: Enums.EntityAction.Register,
                    data: {
                        name: "my_plugin_for_desktop_wallet"
                    }
                })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(entityRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(entityRegistration.id).toBeForged();
            await expect(entityRegistration).entityRegistered();

            // Updating the desktop wallet plugin
            const entityUpdate = TransactionFactory.initialize(app)
                .entity({
                    type,
                    subType,
                    action: Enums.EntityAction.Update,
                    registrationId: entityRegistration.id,
                    data: {
                        ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ"
                    }
                })
                .withFee(staticFeeUpdate)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(entityUpdate).toBeAccepted();
            await snoozeForBlock(1);
            await expect(entityUpdate.id).toBeForged();
            await expect(entityUpdate).entityUpdated();
        });

        it("should reject entity update, because of incorrect fee [Signed with 1 Passphrase]", async () => {
            // entity registration
            const entityRegistration = TransactionFactory.initialize(app).entity({
                type: Enums.EntityType.Plugin,
                subType,
                action: Enums.EntityAction.Register,
                data: {
                    name: "some_other_name",
                },
            })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(entityRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(entityRegistration.id).toBeForged();
            await expect(entityRegistration).entityRegistered();

            const entityUpdate = TransactionFactory.initialize(app).entity({
                type: Enums.EntityType.Plugin,
                subType,
                action: Enums.EntityAction.Update,
                registrationId: entityRegistration.id,
                data: {
                    ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ",
                },
            })
                .withFee(5000000000) // this is an invalid fee - fee for register (50) instead of update fee
                .withPassphrase(secrets[0])
                .createOne();

            await expect(entityUpdate).toBeRejected();
            await snoozeForBlock(1);
            await expect(entityUpdate.id).not.toBeForged();
            await expect(entityUpdate).not.entityUpdated();
        });

        it("should reject entity update, because associated register belongs to another wallet [Signed with 1 Passphrase]", async () => {
            // entity registration
            const entityRegistration = TransactionFactory.initialize(app)
                .entity({
                    type: Enums.EntityType.Plugin,
                    subType,
                    action: Enums.EntityAction.Register,
                    data: {
                        name: "another_name"
                    }
                })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(entityRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(entityRegistration.id).toBeForged();
            await expect(entityRegistration).entityRegistered();

            // Trying to update the desktop wallet plugin of secrets[0] wallet using secrets[1]
            const entityUpdate = TransactionFactory.initialize(app)
                .entity({
                    type: Enums.EntityType.Plugin,
                    subType,
                    action: Enums.EntityAction.Update,
                    registrationId: entityRegistration.id,
                    data: {
                        ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ"
                    }
                })
                .withFee(staticFeeUpdate)
                .withPassphrase(secrets[1])
                .createOne();

            await expect(entityUpdate).toBeRejected();
            await snoozeForBlock(1);
            await expect(entityUpdate.id).not.toBeForged();
            await expect(entityUpdate).not.entityUpdated();
        });

        it("should reject entity update, because associated register does not have same subtype [Signed with 1 Passphrase]", async () => {
            // entity registration
            const entityRegistration = TransactionFactory.initialize(app)
                .entity({
                    type: Enums.EntityType.Plugin,
                    subType,
                    action: Enums.EntityAction.Register,
                    data: {
                        name: "again_another_name"
                    }
                })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(entityRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(entityRegistration.id).toBeForged();
            await expect(entityRegistration).entityRegistered();

            // Trying to update with a different subtype
            const entityUpdate = TransactionFactory.initialize(app)
                .entity({
                    type: Enums.EntityType.Plugin,
                    subType: subType + 7,
                    action: Enums.EntityAction.Update,
                    registrationId: entityRegistration.id,
                    data: {
                        ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ"
                    }
                })
                .withFee(staticFeeUpdate)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(entityUpdate).toBeRejected();
            await snoozeForBlock(1);
            await expect(entityUpdate.id).not.toBeForged();
            await expect(entityUpdate).not.entityUpdated();
        });
    });

    describe("Signed with 2 Passphrases", () => {
        it("should broadcast, accept and forge it [Signed with 2 Passphrases] ", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();
            const secondPassphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.initialize(app)
                .transfer(Identities.Address.fromPassphrase(passphrase), 150 * 1e8)
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

            // Registering entity
            const entityRegistration = TransactionFactory.initialize(app)
                .entity({
                    type: Enums.EntityType.Business,
                    subType,
                    action: Enums.EntityAction.Register,
                    data: {
                        name: "b_bizbiz"
                    }
                })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(entityRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(entityRegistration.id).toBeForged();
            await expect(entityRegistration).entityRegistered();

            // Updating entity
            const entityUpdate = TransactionFactory.initialize(app)
                .entity({
                    type: Enums.EntityType.Business,
                    subType,
                    action: Enums.EntityAction.Update,
                    registrationId: entityRegistration.id,
                    data: {
                        ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ"
                    }
                })
                .withFee(staticFeeUpdate)
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(entityUpdate).toBeAccepted();
            await snoozeForBlock(1);
            await expect(entityUpdate.id).toBeForged();
            await expect(entityUpdate).entityUpdated();
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
                .transfer(Identities.Address.fromPassphrase(passphrase), 50 * 1e8)
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
                .transfer(multiSigAddress, 100 * 1e8)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(multiSignatureFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(multiSignatureFunds.id).toBeForged();

            // Registering entity
            const entityRegistration = TransactionFactory.initialize(app)
                .entity({
                    type: Enums.EntityType.Module,
                    subType,
                    action: Enums.EntityAction.Register,
                    data: {
                        name: "iam_a_module"
                    }
                })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(entityRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(entityRegistration.id).toBeForged();
            await expect(entityRegistration).entityRegistered();

            // Updating entity
            const entityUpdate = TransactionFactory.initialize(app)
                .entity({
                    type: Enums.EntityType.Module,
                    subType,
                    action: Enums.EntityAction.Update,
                    registrationId: entityRegistration.id,
                    data: {
                        ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ"
                    }
                })
                .withFee(staticFeeUpdate)
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(entityUpdate).toBeAccepted();
            await snoozeForBlock(1);
            await expect(entityUpdate.id).toBeForged();
            await expect(entityUpdate).entityUpdated();
        });
    });
});
