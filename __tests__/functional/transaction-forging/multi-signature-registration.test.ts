import "@packages/core-test-framework/src/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { Identities, Managers } from "@arkecosystem/crypto";

import {
    snoozeForBlock,
    getLastHeight,
    injectMilestone,
    TransactionFactory,
} from "@packages/core-test-framework/src/utils";
import secrets from "@packages/core-test-framework/src/internal/passphrases.json";
import * as support from "./__support__";

const { passphrase, secondPassphrase } = support.passphrases;

let app: Contracts.Kernel.Application;
beforeAll(async () => (app = await support.setUp()));
afterAll(async () => await support.tearDown());

describe("Transaction Forging - Multi Signature Registration", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
        // Funds to register a multi signature wallet
        const initialFunds = TransactionFactory.init(app)
            .transfer(Identities.Address.fromPassphrase(passphrase), 50 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await snoozeForBlock(1);
        await expect(initialFunds.id).toBeForged();

        // Register a multi signature wallet with defaults
        const passphrases = [passphrase, secrets[1], secrets[2]];
        const participants = [
            Identities.PublicKey.fromPassphrase(passphrases[0]),
            Identities.PublicKey.fromPassphrase(passphrases[1]),
            Identities.PublicKey.fromPassphrase(passphrases[2]),
        ];

        const multiSignature = TransactionFactory.init(app)
            .multiSignature(participants, 3)
            .withPassphrase(passphrase)
            .withPassphraseList(passphrases)
            .createOne();

        await expect(multiSignature).toBeAccepted();
        await snoozeForBlock(1);
        await expect(multiSignature.id).toBeForged();
    });

    it("should broadcast, accept and forge it [Signed with 2 Passphrases]", async () => {
        const passphrase = secrets[2];
        // Make a fresh wallet for the second signature tests
        const initialFunds = TransactionFactory.init(app)
            .transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
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

        // Register a multi signature wallet with defaults
        const passphrases = [passphrase, secrets[3], secrets[4]];
        const participants = [
            Identities.PublicKey.fromPassphrase(passphrases[0]),
            Identities.PublicKey.fromPassphrase(passphrases[1]),
            Identities.PublicKey.fromPassphrase(passphrases[2]),
        ];

        const multiSignature = TransactionFactory.init(app)
            .multiSignature(participants, 3)
            .withPassphraseList(passphrases)
            .withPassphrasePair({ passphrase, secondPassphrase })
            .createOne();

        await expect(multiSignature).toBeAccepted();
        await snoozeForBlock(1);
        await expect(multiSignature.id).toBeForged();
    });

    it("should reject before AIP11 milestone and accept after AIP11 milestone", async () => {
        const passphrase = secrets[6];
        const initialFunds = TransactionFactory.init(app)
            .transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await snoozeForBlock(1);
        await expect(initialFunds.id).toBeForged();

        // Register a multi signature wallet with defaults
        const passphrases = [passphrase, secrets[3], secrets[4]];
        const participants = [
            Identities.PublicKey.fromPassphrase(passphrases[0]),
            Identities.PublicKey.fromPassphrase(passphrases[1]),
            Identities.PublicKey.fromPassphrase(passphrases[2]),
        ];

        const multiSignature = TransactionFactory.init(app)
            .multiSignature(participants, 3)
            .withPassphraseList(passphrases)
            .withPassphrase(passphrase)
            .createOne();

        Managers.configManager.getMilestone().aip11 = false;

        injectMilestone(1, {
            height: getLastHeight(app) + 1,
            aip11: true,
        });

        await expect(multiSignature).toBeRejected();
        await snoozeForBlock(1);
        await expect(multiSignature.id).not.toBeForged();

        expect(Managers.configManager.getMilestone().aip11).toBeTrue();

        await expect(multiSignature).toBeAccepted();
        await snoozeForBlock(1);
        await expect(multiSignature.id).toBeForged();
    });
});
