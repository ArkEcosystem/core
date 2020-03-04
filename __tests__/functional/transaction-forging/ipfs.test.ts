import "@packages/core-test-framework/src/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { Identities } from "@arkecosystem/crypto";
import secrets from "@packages/core-test-framework/src/internal/passphrases.json";
import { snoozeForBlock, TransactionFactory } from "@packages/core-test-framework/src/utils";

import * as support from "./__support__";

const { passphrase, secondPassphrase } = support.passphrases;
const ipfsIds = [
    "QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w",
    "QmYSK2JyM3RyDyB52caZCTKFR3HKniEcMnNJYdk8DQ6KKB",
    "QmQeUqdjFmaxuJewStqCLUoKrR9khqb4Edw9TfRQQdfWz3",
    "Qma98bk1hjiRZDTmYmfiUXDj8hXXt7uGA5roU5mfUb3sVG",
];

let app: Contracts.Kernel.Application;
beforeAll(async () => (app = await support.setUp()));
afterAll(async () => await support.tearDown());

describe("Transaction Forging - IPFS", () => {
    describe("Signed with 1 Passphase", () => {
        it("should broadcast, accept and forge it", async () => {
            // Initial Funds
            const initialFunds = TransactionFactory.initialize(app)
                .transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Submit ipfs transaction
            const transactions = TransactionFactory.initialize(app)
                .ipfs(ipfsIds[0])
                .withPassphrase(passphrase)
                .createOne();

            await expect(transactions).toBeAccepted();
            await snoozeForBlock(1);
            await expect(transactions.id).toBeForged();
        });

        it("should broadcast, reject and not forge it if the hash is already registered on the blockchain", async () => {
            // Submit ipfs transaction again
            const transactions = TransactionFactory.initialize(app)
                .ipfs(ipfsIds[0])
                .withPassphrase(passphrase)
                .createOne();

            await expect(transactions).toBeRejected();
            await snoozeForBlock(1);
            await expect(transactions.id).not.toBeForged();
        });
    });

    it("should broadcast, accept and forge it [Signed with 2 Passphrases]", async () => {
        // Make a fresh wallet for the second signature tests
        const passphrase = secondPassphrase;

        // Initial Funds
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

        // Submit ipfs transaction
        const transactions = TransactionFactory.initialize(app)
            .ipfs(ipfsIds[1])
            .withPassphrasePair({ passphrase, secondPassphrase })
            .createOne();

        await expect(transactions).toBeAccepted();
        await snoozeForBlock(1);
        await expect(transactions.id).toBeForged();
    });

    it("should broadcast, accept and forge it [3-of-3 multisig]", async () => {
        // Funds to register a multi signature wallet
        const initialFunds = TransactionFactory.initialize(app)
            .transfer(Identities.Address.fromPassphrase(secrets[3]), 50 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await snoozeForBlock(1);
        await expect(initialFunds.id).toBeForged();

        // Register a multi signature wallet with defaults
        const passphrases = [secrets[3], secrets[4], secrets[5]];
        const participants = [
            Identities.PublicKey.fromPassphrase(passphrases[0]),
            Identities.PublicKey.fromPassphrase(passphrases[1]),
            Identities.PublicKey.fromPassphrase(passphrases[2]),
        ];

        const multiSignature = TransactionFactory.initialize(app)
            .multiSignature(participants, 3)
            .withPassphrase(secrets[3])
            .withPassphraseList(passphrases)
            .createOne();

        await expect(multiSignature).toBeAccepted();
        await snoozeForBlock(1);
        await expect(multiSignature.id).toBeForged();

        // Send funds to multi signature wallet
        const multiSigAddress = Identities.Address.fromMultiSignatureAsset(multiSignature.asset.multiSignature);
        const multiSigPublicKey = Identities.PublicKey.fromMultiSignatureAsset(multiSignature.asset.multiSignature);

        const multiSignatureFunds = TransactionFactory.initialize(app)
            .transfer(multiSigAddress, 20 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(multiSignatureFunds).toBeAccepted();
        await snoozeForBlock(1);
        await expect(multiSignatureFunds.id).toBeForged();

        // Submit ipfs transaction
        const transactions = TransactionFactory.initialize(app)
            .ipfs(ipfsIds[2])
            .withSenderPublicKey(multiSigPublicKey)
            .withPassphraseList(passphrases)
            .createOne();

        await expect(transactions).toBeAccepted();
        await snoozeForBlock(1);
        await expect(transactions.id).toBeForged();
    });
});
