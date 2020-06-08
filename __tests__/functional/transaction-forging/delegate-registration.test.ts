import "@packages/core-test-framework/src/matchers";

import secrets from "@packages/core-test-framework/src/internal/passphrases.json";
import { snoozeForBlock, TransactionFactory } from "@packages/core-test-framework/src/utils";

import { CryptoSuite } from "../../../packages/core-crypto";
import { Sandbox } from "../../../packages/core-test-framework/src";
import * as support from "./__support__";

const { passphrase, secondPassphrase } = support.passphrases;

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));

const sandbox: Sandbox = new Sandbox(crypto);

beforeAll(async () => {
    await support.setUp(sandbox, crypto);
});
afterAll(async () => await support.tearDown(sandbox));

describe("Transaction Forging - Delegate Registration", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphase]", async () => {
        // Initial Funds
        const initialFunds = TransactionFactory.initialize(crypto, sandbox.app)
            .transfer(crypto.CryptoManager.Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await snoozeForBlock(crypto.CryptoManager, 1);
        await expect(initialFunds.id).toBeForged();

        // Register a delegate
        const transactions = TransactionFactory.initialize(crypto, sandbox.app)
            .delegateRegistration()
            .withPassphrase(passphrase)
            .createOne();

        await expect(transactions).toBeAccepted();
        await snoozeForBlock(crypto.CryptoManager, 1);
        await expect(transactions.id).toBeForged();
    });

    it("should broadcast, accept and forge it [Signed with 2 Passphrases]", async () => {
        // Make a fresh wallet for the second signature tests
        const passphrase = secondPassphrase;

        // Initial Funds
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

        // Register a delegate
        const delegateRegistration = TransactionFactory.initialize(crypto, sandbox.app)
            .delegateRegistration()
            .withPassphrasePair({ passphrase, secondPassphrase })
            .createOne();

        await expect(delegateRegistration).toBeAccepted();
        await snoozeForBlock(crypto.CryptoManager, 1);
        await expect(delegateRegistration.id).toBeForged();
    });

    it("should broadcast, accept and forge it [3-of-3 multisig]", async () => {
        // Funds to register a multi signature wallet
        const initialFunds = TransactionFactory.initialize(crypto, sandbox.app)
            .transfer(crypto.CryptoManager.Identities.Address.fromPassphrase(secrets[3]), 50 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await snoozeForBlock(crypto.CryptoManager, 1);
        await expect(initialFunds.id).toBeForged();

        // Register a multi signature wallet with defaults
        const passphrases = [secrets[3], secrets[4], secrets[5]];
        const participants = [
            crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[0]),
            crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[1]),
            crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[2]),
        ];

        const multiSignature = TransactionFactory.initialize(crypto, sandbox.app)
            .multiSignature(participants, 3)
            .withPassphrase(secrets[3])
            .withPassphraseList(passphrases)
            .createOne();

        await expect(multiSignature).toBeAccepted();
        await snoozeForBlock(crypto.CryptoManager, 1);
        await expect(multiSignature.id).toBeForged();

        // Send funds to multi signature wallet
        const multiSigAddress = crypto.CryptoManager.Identities.Address.fromMultiSignatureAsset(
            multiSignature.asset.multiSignature,
        );
        const multiSigPublicKey = crypto.CryptoManager.Identities.PublicKey.fromMultiSignatureAsset(
            multiSignature.asset.multiSignature,
        );

        const multiSignatureFunds = TransactionFactory.initialize(crypto, sandbox.app)
            .transfer(multiSigAddress, 30 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(multiSignatureFunds).toBeAccepted();
        await snoozeForBlock(crypto.CryptoManager, 1);
        await expect(multiSignatureFunds.id).toBeForged();

        // Try to register a delegate which should fail
        const delegateRegistration = TransactionFactory.initialize(crypto, sandbox.app)
            .delegateRegistration()
            .withSenderPublicKey(multiSigPublicKey)
            .withPassphraseList(passphrases)
            .createOne();

        await expect(delegateRegistration).toBeRejected();
        await snoozeForBlock(crypto.CryptoManager, 1);
        await expect(delegateRegistration.id).not.toBeForged();

        // createOne transfer to assert multi sig wallet can still send funds
        const transfer = TransactionFactory.initialize(crypto, sandbox.app)
            .transfer(multiSigAddress, 29 * 1e8)
            .withSenderPublicKey(multiSigPublicKey)
            .withPassphraseList(passphrases)
            .createOne();

        await expect(transfer).toBeAccepted();
        await snoozeForBlock(crypto.CryptoManager, 1);
        await expect(transfer.id).toBeForged();
    });
});
