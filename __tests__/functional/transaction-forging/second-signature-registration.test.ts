import "@packages/core-test-framework/src/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import secrets from "@packages/core-test-framework/src/internal/passphrases.json";
import { snoozeForBlock, TransactionFactory } from "@packages/core-test-framework/src/utils";

import { CryptoSuite } from "../../../packages/core-crypto";
import { Sandbox } from "../../../packages/core-test-framework/src";
import * as support from "./__support__";

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));

const sandbox: Sandbox = new Sandbox(crypto);

beforeAll(async () => {
    await support.setUp(sandbox, crypto);
});
afterAll(async () => await support.tearDown(sandbox));

describe("Transaction Forging - Second Signature Registration", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
        const secondSignature = TransactionFactory.initialize(crypto, sandbox.app)
            .secondSignature(support.passphrases.secondPassphrase)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(secondSignature).toBeAccepted();
        await snoozeForBlock(crypto.CryptoManager, 1);
        await expect(secondSignature.id).toBeForged();
    });

    it("should not broadcast, accept and forge it [3-of-3 multisig]", async () => {
        // Funds to register a multi signature wallet
        const initialFunds = TransactionFactory.initialize(crypto, sandbox.app)
            .transfer(crypto.CryptoManager.Identities.Address.fromPassphrase(secrets[3]), 50 * 1e8)
            .withPassphrase(secrets[1])
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
            .transfer(multiSigAddress, 20 * 1e8)
            .withPassphrase(secrets[1])
            .createOne();

        await expect(multiSignatureFunds).toBeAccepted();
        await snoozeForBlock(crypto.CryptoManager, 1);
        await expect(multiSignatureFunds.id).toBeForged();

        // Create second signature registration
        const secondSignature = TransactionFactory.initialize(crypto, sandbox.app)
            .secondSignature(support.passphrases.secondPassphrase)
            .withSenderPublicKey(multiSigPublicKey)
            .withPassphraseList(passphrases)
            .createOne();

        await expect(secondSignature).toBeRejected();
        await snoozeForBlock(crypto.CryptoManager, 1);
        await expect(secondSignature.id).not.toBeForged();

        // Create transfer to assert multi sig wallet can still send funds
        const transfer = TransactionFactory.initialize(crypto, sandbox.app)
            .transfer(multiSigAddress, 18 * 1e8)
            .withSenderPublicKey(multiSigPublicKey)
            .withPassphraseList(passphrases)
            .createOne();

        await expect(transfer).toBeAccepted();
        await snoozeForBlock(crypto.CryptoManager, 1);
        await expect(transfer.id).toBeForged();
    });
});
