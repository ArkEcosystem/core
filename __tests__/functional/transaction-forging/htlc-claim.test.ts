import "@packages/core-test-framework/src/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { Crypto, Enums, Identities } from "@arkecosystem/crypto";
import secrets from "@packages/core-test-framework/src/internal/passphrases.json";
import { snoozeForBlock, TransactionFactory } from "@packages/core-test-framework/src/utils";

import { htlcSecretHashHex, htlcSecretHex } from "../../unit/crypto/transactions/__fixtures__/htlc";
import * as support from "./__support__";

const { passphrase, secondPassphrase } = support.passphrases;

const { EpochTimestamp } = Enums.HtlcLockExpirationType;

let app: Contracts.Kernel.Application;
beforeAll(async () => (app = await support.setUp()));
afterAll(async () => await support.tearDown());

describe("Transaction Forging - HTLC Claim", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphase]", async () => {
        // Initial Funds
        const initialFunds = TransactionFactory.initialize(app)
            .transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await snoozeForBlock(1);
        await expect(initialFunds.id).toBeForged();

        // Submit htlc lock transaction
        const lockTransaction = TransactionFactory.initialize(app)
            .htlcLock(
                {
                    secretHash: htlcSecretHashHex,
                    expiration: {
                        type: EpochTimestamp,
                        value: Crypto.Slots.getTime() + 1000,
                    },
                },
                Identities.Address.fromPassphrase(secrets[1], 23),
            )
            .withPassphrase(passphrase)
            .createOne();

        await expect(lockTransaction).toBeAccepted();
        await snoozeForBlock(1);
        await expect(lockTransaction.id).toBeForged();

        // Submit htlc claim transaction
        const transaction = TransactionFactory.initialize(app)
            .htlcClaim({
                unlockSecret: htlcSecretHex,
                lockTransactionId: lockTransaction.id,
            })
            .withPassphrase(secrets[1])
            .createOne();

        await expect(transaction).toBeAccepted();
        await snoozeForBlock(1);
        await expect(transaction.id).toBeForged();
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

        // Initial htlc lock transaction
        const lockTransaction = TransactionFactory.initialize(app)
            .htlcLock(
                {
                    secretHash: htlcSecretHashHex,
                    expiration: {
                        type: EpochTimestamp,
                        value: Crypto.Slots.getTime() + 1000,
                    },
                },
                Identities.Address.fromPassphrase(passphrase),
            )
            .withPassphrase(secrets[0])
            .createOne();

        await expect(lockTransaction).toBeAccepted();
        await snoozeForBlock(1);
        await expect(lockTransaction.id).toBeForged();

        // Submit htlc claim transaction
        const claimTransaction = TransactionFactory.initialize(app)
            .htlcClaim({
                unlockSecret: htlcSecretHex,
                lockTransactionId: lockTransaction.id,
            })
            .withPassphrasePair({ passphrase, secondPassphrase })
            .createOne();

        await expect(claimTransaction).toBeAccepted();
        await snoozeForBlock(1);
        await expect(claimTransaction.id).toBeForged();
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

        // Initial htlc lock transaction
        const lockTransaction = TransactionFactory.initialize(app)
            .htlcLock(
                {
                    secretHash: htlcSecretHashHex,
                    expiration: {
                        type: EpochTimestamp,
                        value: Crypto.Slots.getTime() + 1000,
                    },
                },
                multiSigAddress,
            )
            .withPassphrase(secrets[0])
            .createOne();

        await expect(lockTransaction).toBeAccepted();
        await snoozeForBlock(1);
        await expect(lockTransaction.id).toBeForged();

        // Submit htlc claim transaction
        const claimTransaction = TransactionFactory.initialize(app)
            .htlcClaim({
                unlockSecret: htlcSecretHex,
                lockTransactionId: lockTransaction.id,
            })
            .withSenderPublicKey(multiSigPublicKey)
            .withPassphraseList(passphrases)
            .createOne();

        await expect(claimTransaction).toBeAccepted();
        await snoozeForBlock(1);
        await expect(claimTransaction.id).toBeForged();
    });
});
