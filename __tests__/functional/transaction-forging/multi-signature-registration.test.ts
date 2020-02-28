import "@packages/core-test-framework/src/matchers";

import { Container, Contracts, Services } from "@arkecosystem/core-kernel";
import { Identities, Interfaces, Managers } from "@arkecosystem/crypto";
import secrets from "@packages/core-test-framework/src/internal/passphrases.json";
import {
    getLastHeight,
    injectMilestone,
    snoozeForBlock,
    TransactionFactory,
} from "@packages/core-test-framework/src/utils";

import * as support from "./__support__";

const { passphrase, secondPassphrase } = support.passphrases;

let app: Contracts.Kernel.Application;
let networkConfig: Interfaces.NetworkConfig;

beforeAll(async () => {
    app = await support.setUp();

    // todo: remove the need for this and manual calls to withNetworkConfig on the transaction factory
    networkConfig = app.get<Services.Config.ConfigRepository>(Container.Identifiers.ConfigRepository).get("crypto");
});

afterAll(async () => await support.tearDown());

describe("Transaction Forging - Multi Signature Registration", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
        // Funds to register a multi signature wallet
        const initialFunds = TransactionFactory.initialize(app)
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

        const multiSignature = TransactionFactory.initialize(app)
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
        const initialFunds = TransactionFactory.initialize(app)
            .transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
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

        // Register a multi signature wallet with defaults
        const passphrases = [passphrase, secrets[3], secrets[4]];
        const participants = [
            Identities.PublicKey.fromPassphrase(passphrases[0]),
            Identities.PublicKey.fromPassphrase(passphrases[1]),
            Identities.PublicKey.fromPassphrase(passphrases[2]),
        ];

        const multiSignature = TransactionFactory.initialize(app)
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
        const initialFunds = TransactionFactory.initialize(app)
            .withNetworkConfig(networkConfig)
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

        const multiSignature = TransactionFactory.initialize(app)
            .withNetworkConfig(networkConfig)
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
