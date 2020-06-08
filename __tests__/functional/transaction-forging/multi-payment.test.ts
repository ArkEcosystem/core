import "@packages/core-test-framework/src/matchers";

import { Container } from "@arkecosystem/core-kernel";
import secrets from "@packages/core-test-framework/src/internal/passphrases.json";
import { snoozeForBlock, TransactionFactory } from "@packages/core-test-framework/src/utils";

import { CryptoSuite } from "../../../packages/core-crypto";
import { Sandbox } from "../../../packages/core-test-framework/src";
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

const cryptoSuite = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));
let cryptoManager: CryptoSuite.CryptoManager;

const sandbox: Sandbox = new Sandbox(cryptoSuite);

beforeAll(async () => {
    await support.setUp(sandbox, cryptoSuite);
    cryptoManager = sandbox.app.get<CryptoSuite.CryptoManager>(Container.Identifiers.CryptoManager);
});
afterAll(async () => await support.tearDown(sandbox));

describe("Transaction Forging - Multipayment", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphase]", async () => {
        // Initial Funds
        const initialFunds = TransactionFactory.initialize(cryptoSuite, sandbox.app)
            .transfer(cryptoSuite.CryptoManager.Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await snoozeForBlock(cryptoManager, 1);
        await expect(initialFunds.id).toBeForged();

        // Submit multipayment transaction
        const transactions = TransactionFactory.initialize(cryptoSuite, sandbox.app)
            .multiPayment(payments)
            .withPassphrase(passphrase)
            .createOne();

        await expect(transactions).toBeAccepted();
        await snoozeForBlock(cryptoManager, 1);
        await expect(transactions.id).toBeForged();
    });

    it("should broadcast, accept and forge it [max payments per tx, 200 tx] [Signed with 1 Passphase]", async () => {
        // Initial Funds
        const initialFunds = TransactionFactory.initialize(cryptoSuite, sandbox.app)
            .transfer(cryptoSuite.CryptoManager.Identities.Address.fromPassphrase(passphrase), 5000 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await snoozeForBlock(cryptoManager, 1);
        await expect(initialFunds.id).toBeForged();

        const payments = [];
        for (let i = 1; i <= cryptoManager.MilestoneManager.getMilestone().multiPaymentLimit; i++) {
            payments.push({
                recipientId: "AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd",
                amount: "1",
            });
        }
        // Submit multipayment transaction
        const transactions = TransactionFactory.initialize(cryptoSuite, sandbox.app)
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
        const initialFunds = TransactionFactory.initialize(cryptoSuite, sandbox.app)
            .transfer(cryptoSuite.CryptoManager.Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await snoozeForBlock(cryptoManager, 1);
        await expect(initialFunds.id).toBeForged();

        const payments = [];
        for (let i = 1; i <= cryptoManager.MilestoneManager.getMilestone().multiPaymentLimit; i++) {
            payments.push({
                recipientId: "AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd",
                amount: "" + i,
            });
        }

        // Submit multipayment transaction
        const factory = TransactionFactory.initialize(cryptoSuite, sandbox.app)
            .multiPayment(payments)
            .withPassphrase(passphrase)
            .withFee(2 * 1e8);

        (factory as any).builder.data.asset.payments.push({
            recipientId: "AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd",
            amount: cryptoSuite.CryptoManager.LibraryManager.Libraries.BigNumber.ONE,
        });

        const transaction = factory.createOne();
        expect(transaction.asset.payments.length).toBe(
            cryptoManager.MilestoneManager.getMilestone().multiPaymentLimit + 1,
        );

        await expect(transaction).not.toBeAccepted();
        await snoozeForBlock(cryptoManager, 1);
        await expect(transaction.id).not.toBeForged();
    });

    it("should broadcast, accept and forge it [Signed with 2 Passphrases]", async () => {
        // Make a fresh wallet for the second signature tests
        const passphrase = secondPassphrase;

        // Initial Funds
        const initialFunds = TransactionFactory.initialize(cryptoSuite, sandbox.app)
            .transfer(cryptoSuite.CryptoManager.Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await snoozeForBlock(cryptoManager, 1);
        await expect(initialFunds.id).toBeForged();

        // Register a second passphrase
        const secondSignature = TransactionFactory.initialize(cryptoSuite, sandbox.app)
            .secondSignature(secondPassphrase)
            .withPassphrase(passphrase)
            .createOne();

        await expect(secondSignature).toBeAccepted();
        await snoozeForBlock(cryptoManager, 1);
        await expect(secondSignature.id).toBeForged();

        // Submit multipayment transaction
        const transactions = TransactionFactory.initialize(cryptoSuite, sandbox.app)
            .multiPayment(payments)
            .withPassphrasePair({ passphrase, secondPassphrase })
            .createOne();

        await expect(transactions).toBeAccepted();
        await snoozeForBlock(cryptoManager, 1);
        await expect(transactions.id).toBeForged();
    });

    it("should broadcast, accept and forge it [3-of-3 multisig]", async () => {
        // Funds to register a multi signature wallet
        const initialFunds = TransactionFactory.initialize(cryptoSuite, sandbox.app)
            .transfer(cryptoSuite.CryptoManager.Identities.Address.fromPassphrase(secrets[3]), 50 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await snoozeForBlock(cryptoManager, 1);
        await expect(initialFunds.id).toBeForged();

        // Register a multi signature wallet with defaults
        const passphrases = [secrets[3], secrets[4], secrets[5]];
        const participants = [
            cryptoSuite.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[0]),
            cryptoSuite.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[1]),
            cryptoSuite.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[2]),
        ];

        const multiSignature = TransactionFactory.initialize(cryptoSuite, sandbox.app)
            .multiSignature(participants, 3)
            .withPassphrase(secrets[3])
            .withPassphraseList(passphrases)
            .createOne();

        await expect(multiSignature).toBeAccepted();
        await snoozeForBlock(cryptoManager, 1);
        await expect(multiSignature.id).toBeForged();

        // Send funds to multi signature wallet
        const multiSigAddress = cryptoSuite.CryptoManager.Identities.Address.fromMultiSignatureAsset(
            multiSignature.asset.multiSignature,
        );
        const multiSigPublicKey = cryptoSuite.CryptoManager.Identities.PublicKey.fromMultiSignatureAsset(
            multiSignature.asset.multiSignature,
        );

        const multiSignatureFunds = TransactionFactory.initialize(cryptoSuite, sandbox.app)
            .transfer(multiSigAddress, 20 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(multiSignatureFunds).toBeAccepted();
        await snoozeForBlock(cryptoManager, 1);
        await expect(multiSignatureFunds.id).toBeForged();

        // Submit multipayment transaction
        const transactions = TransactionFactory.initialize(cryptoSuite, sandbox.app)
            .multiPayment(payments)
            .withSenderPublicKey(multiSigPublicKey)
            .withPassphraseList(passphrases)
            .createOne();

        await expect(transactions).toBeAccepted();
        await snoozeForBlock(cryptoManager, 1);
        await expect(transactions.id).toBeForged();
    });
});
