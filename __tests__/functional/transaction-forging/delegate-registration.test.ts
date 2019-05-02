import { Identities } from "@arkecosystem/crypto";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

const { passphrase, secondPassphrase } = support.passphrases;

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Delegate Registration", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphase]", async () => {
        // Initial Funds
        const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
            .create();

        await support.expectAcceptAndBroadcast(initialFunds, initialFunds[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(initialFunds[0].id);

        // Register a delegate
        const transactions = TransactionFactory.delegateRegistration()
            .withPassphrase(passphrase)
            .create();

        await support.expectAcceptAndBroadcast(transactions, transactions[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(transactions[0].id);
    });

    it("should broadcast, accept and forge it [Signed with 2 Passphrases]", async () => {
        // Make a fresh wallet for the second signature tests
        const passphrase = secondPassphrase;

        // Initial Funds
        const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
            .create();

        await support.expectAcceptAndBroadcast(initialFunds, initialFunds[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(initialFunds[0].id);

        // Register a second passphrase
        const secondSignature = TransactionFactory.secondSignature(secondPassphrase)
            .withPassphrase(passphrase)
            .create();

        await support.expectAcceptAndBroadcast(secondSignature, secondSignature[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(secondSignature[0].id);

        // Register a delegate
        const delegateRegistration = TransactionFactory.delegateRegistration()
            .withPassphrasePair({ passphrase, secondPassphrase })
            .create();

        await support.expectAcceptAndBroadcast(delegateRegistration, delegateRegistration[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(delegateRegistration[0].id);
    });

    it("should broadcast, accept and forge it [3-of-3 multisig]", async () => {
        // Funds to register a multi signature wallet
        const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(secrets[3]), 50 * 1e8)
            .withPassphrase(secrets[0])
            .create();

        await support.expectAcceptAndBroadcast(initialFunds, initialFunds[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(initialFunds[0].id);

        // Register a multi signature wallet with defaults
        const passphrases = [secrets[3], secrets[4], secrets[5]];
        const participants = [
            Identities.PublicKey.fromPassphrase(passphrases[0]),
            Identities.PublicKey.fromPassphrase(passphrases[1]),
            Identities.PublicKey.fromPassphrase(passphrases[2]),
        ];

        const multiSignature = TransactionFactory.multiSignature(participants, 3)
            .withPassphrase(secrets[3])
            .withPassphraseList(passphrases)
            .create();

        await support.expectAcceptAndBroadcast(multiSignature, multiSignature[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(multiSignature[0].id);

        // Send funds to multi signature wallet
        const multiSigAddress = Identities.Address.fromMultiSignatureAsset(multiSignature[0].asset.multiSignature);
        const multiSigPublicKey = Identities.PublicKey.fromMultiSignatureAsset(multiSignature[0].asset.multiSignature);

        const multiSignatureFunds = TransactionFactory.transfer(multiSigAddress, 30 * 1e8)
            .withPassphrase(secrets[0])
            .create();

        await support.expectAcceptAndBroadcast(multiSignatureFunds, multiSignatureFunds[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(multiSignatureFunds[0].id);

        // Try to register a delegate which should fail
        const delegateRegistration = TransactionFactory.delegateRegistration()
            .withSenderPublicKey(multiSigPublicKey)
            .withPassphraseList(passphrases)
            .create();

        await support.expectInvalidAndError(delegateRegistration, delegateRegistration[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionNotForged(delegateRegistration[0].id);

        // Create transfer to assert multi sig wallet can still send funds
        const transfer = TransactionFactory.transfer(multiSigAddress, 29 * 1e8)
            .withSenderPublicKey(multiSigPublicKey)
            .withPassphraseList(passphrases)
            .create();

        await support.expectAcceptAndBroadcast(transfer, transfer[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(transfer[0].id);
    });
});
