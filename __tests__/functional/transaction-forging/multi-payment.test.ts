import "@packages/core-test-framework/src/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { Identities, Managers, Utils } from "@arkecosystem/crypto";
import secrets from "@packages/core-test-framework/src/internal/passphrases.json";
import { snoozeForBlock, TransactionFactory } from "@packages/core-test-framework/src/utils";

import * as support from "./__support__";

const { passphrase, secondPassphrase } = support.passphrases;

const payments = [
    {
        recipientId: "AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd",
        amount: "1000",
    },
    {
        recipientId: "AMUN4qrRt1fAsdMXD3knHoBvy6SZ7hZtR2",
        amount: "3000",
    },
];

process.env.CORE_TRANSACTION_POOL_MAX_PER_SENDER = "1500";
process.env.CORE_API_RATE_LIMIT_USER_LIMIT = "500";

let app: Contracts.Kernel.Application;
beforeAll(async () => (app = await support.setUp()));
afterAll(async () => await support.tearDown());

describe("Transaction Forging - Multipayment", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphase]", async () => {
        // Initial Funds
        const initialFunds = TransactionFactory.initialize(app)
            .transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await snoozeForBlock(1);
        await expect(initialFunds.id).toBeForged();

        // Submit multipayment transaction
        const transactions = TransactionFactory.initialize(app)
            .multiPayment(payments)
            .withPassphrase(passphrase)
            .createOne();

        await expect(transactions).toBeAccepted();
        await snoozeForBlock(1);
        await expect(transactions.id).toBeForged();
    });

    it("should broadcast, accept and forge it [max payments per tx, 200 tx] [Signed with 1 Passphase]", async () => {
        // Initial Funds
        const initialFunds = TransactionFactory.initialize(app)
            .transfer(Identities.Address.fromPassphrase(passphrase), 5000 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await snoozeForBlock(1);
        await expect(initialFunds.id).toBeForged();

        const payments = [];
        for (let i = 1; i <= Managers.configManager.getMilestone().multiPaymentLimit; i++) {
            payments.push({
                recipientId: "AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd",
                amount: "1",
            });
        }
        // Submit multipayment transaction
        const transactions = TransactionFactory.initialize(app)
            .multiPayment(payments)
            .withPassphrase(passphrase)
            .withFee(2 * 1e8)
            .create(200);

        await expect(transactions).toBeEachAccepted();
        await snoozeForBlock(70); // we need 7 blocks for the transactions to be forged (30 per block because of maxTransactionBytes)

        for (const transaction of transactions) {
            await expect(transaction.id).toBeForged();
        }
    });

    it("should NOT broadcast, accept and forge it [max + 1 payments] [Signed with 1 Passphase]", async () => {
        // Initial Funds
        const initialFunds = TransactionFactory.initialize(app)
            .transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await snoozeForBlock(1);
        await expect(initialFunds.id).toBeForged();

        const payments = [];
        for (let i = 1; i <= Managers.configManager.getMilestone().multiPaymentLimit; i++) {
            payments.push({
                recipientId: "AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd",
                amount: "" + i,
            });
        }

        // Submit multipayment transaction
        const factory = TransactionFactory.initialize(app)
            .multiPayment(payments)
            .withPassphrase(passphrase)
            .withFee(2 * 1e8);

        (factory as any).builder.data.asset.payments.push({
            recipientId: "AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd",
            amount: Utils.BigNumber.ONE,
        });

        const transaction = factory.createOne();
        expect(transaction.asset.payments.length).toBe(Managers.configManager.getMilestone().multiPaymentLimit + 1);

        await expect(transaction).not.toBeAccepted();
        await snoozeForBlock(1);
        await expect(transaction.id).not.toBeForged();
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

        // Submit multipayment transaction
        const transactions = TransactionFactory.initialize(app)
            .multiPayment(payments)
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

        // Submit multipayment transaction
        const transactions = TransactionFactory.initialize(app)
            .multiPayment(payments)
            .withSenderPublicKey(multiSigPublicKey)
            .withPassphraseList(passphrases)
            .createOne();

        await expect(transactions).toBeAccepted();
        await snoozeForBlock(1);
        await expect(transactions.id).toBeForged();
    });
});
