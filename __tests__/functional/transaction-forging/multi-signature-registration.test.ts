import "@packages/core-test-framework/src/matchers";

import { Container, Services } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";
import secrets from "@packages/core-test-framework/src/internal/passphrases.json";
import {
    getLastHeight,
    injectMilestone,
    snoozeForBlock,
    TransactionFactory,
} from "@packages/core-test-framework/src/utils";

import { CryptoSuite, Interfaces as BlockInterfaces } from "../../../packages/core-crypto";
import { Sandbox } from "../../../packages/core-test-framework/src";
import * as support from "./__support__";

const { passphrase, secondPassphrase } = support.passphrases;

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));
let networkConfig: Interfaces.NetworkConfig<BlockInterfaces.IBlockData>;
let cryptoManager: CryptoSuite.CryptoManager;

const sandbox: Sandbox = new Sandbox(crypto);

beforeAll(async () => {
    await support.setUp(sandbox, crypto);
    networkConfig = sandbox.app
        .get<Services.Config.ConfigRepository>(Container.Identifiers.ConfigRepository)
        .get("crypto");

    cryptoManager = sandbox.app.get<CryptoSuite.CryptoManager>(Container.Identifiers.CryptoManager);
});
afterAll(async () => await support.tearDown(sandbox));

describe("Transaction Forging - Multi Signature Registration", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
        // Funds to register a multi signature wallet
        const initialFunds = TransactionFactory.initialize(crypto, sandbox.app)
            .transfer(crypto.CryptoManager.Identities.Address.fromPassphrase(passphrase), 50 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await snoozeForBlock(crypto.CryptoManager, 1);
        await expect(initialFunds.id).toBeForged();

        // Register a multi signature wallet with defaults
        const passphrases = [passphrase, secrets[1], secrets[2]];
        const participants = [
            crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[0]),
            crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[1]),
            crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[2]),
        ];

        const multiSignature = TransactionFactory.initialize(crypto, sandbox.app)
            .multiSignature(participants, 3)
            .withPassphrase(passphrase)
            .withPassphraseList(passphrases)
            .createOne();

        await expect(multiSignature).toBeAccepted();
        await snoozeForBlock(crypto.CryptoManager, 1);
        await expect(multiSignature.id).toBeForged();
    });

    it("should broadcast, accept and forge it [Signed with 2 Passphrases]", async () => {
        const passphrase = secrets[2];
        // Make a fresh wallet for the second signature tests
        const initialFunds = TransactionFactory.initialize(crypto, sandbox.app)
            .transfer(crypto.CryptoManager.Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await snoozeForBlock(crypto.CryptoManager, 1);
        await expect(initialFunds.id).toBeForged();

        // Register a second passphrase
        const secondSignature = TransactionFactory.initialize(crypto, sandbox.app)
            .secondSignature(secondPassphrase)
            .withPassphrase(passphrase)
            .createOne();

        await expect(secondSignature).toBeAccepted();
        await snoozeForBlock(crypto.CryptoManager, 1);
        await expect(secondSignature.id).toBeForged();

        // Register a multi signature wallet with defaults
        const passphrases = [passphrase, secrets[3], secrets[4]];
        const participants = [
            crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[0]),
            crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[1]),
            crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[2]),
        ];

        const multiSignature = TransactionFactory.initialize(crypto, sandbox.app)
            .multiSignature(participants, 3)
            .withPassphraseList(passphrases)
            .withPassphrasePair({ passphrase, secondPassphrase })
            .createOne();

        await expect(multiSignature).toBeAccepted();
        await snoozeForBlock(crypto.CryptoManager, 1);
        await expect(multiSignature.id).toBeForged();
    });

    it("should reject before AIP11 milestone and accept after AIP11 milestone", async () => {
        const passphrase = secrets[6];
        const initialFunds = TransactionFactory.initialize(crypto, sandbox.app)
            .withNetworkConfig(networkConfig)
            .transfer(crypto.CryptoManager.Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await snoozeForBlock(crypto.CryptoManager, 1);
        await expect(initialFunds.id).toBeForged();

        // Register a multi signature wallet with defaults
        const passphrases = [passphrase, secrets[3], secrets[4]];
        const participants = [
            crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[0]),
            crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[1]),
            crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[2]),
        ];

        const multiSignature = TransactionFactory.initialize(crypto, sandbox.app)
            .withNetworkConfig(networkConfig)
            .multiSignature(participants, 3)
            .withPassphraseList(passphrases)
            .withPassphrase(passphrase)
            .createOne();

        cryptoManager.MilestoneManager.getMilestone().aip11 = false;

        injectMilestone(cryptoManager, {
            height: getLastHeight(sandbox.app) + 1,
            aip11: true,
        });

        await expect(multiSignature).toBeRejected();
        await snoozeForBlock(crypto.CryptoManager, 1);
        await expect(multiSignature.id).not.toBeForged();

        expect(cryptoManager.MilestoneManager.getMilestone().aip11).toBeTrue();

        await expect(multiSignature).toBeAccepted();
        await snoozeForBlock(crypto.CryptoManager, 1);
        await expect(multiSignature.id).toBeForged();
    });
});
