import { Identities } from "@arkecosystem/crypto";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

const { passphrase, secondPassphrase } = support.passphrases;

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Vote", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphase]", async () => {
        // Initial Funds
        const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
            .create();

        await support.expectAcceptAndBroadcast(initialFunds, initialFunds[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(initialFunds[0].id);

        // Submit a vote
        const transactions = TransactionFactory.vote(Identities.PublicKey.fromPassphrase(secrets[0]))
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

        // Submit a vote
        const vote = TransactionFactory.vote(Identities.PublicKey.fromPassphrase(secrets[0]))
            .withPassphrasePair({ passphrase, secondPassphrase })
            .create();

        await support.expectAcceptAndBroadcast(vote, vote[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(vote[0].id);
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

        const multiSignatureFunds = TransactionFactory.transfer(multiSigAddress, 20 * 1e8)
            .withPassphrase(secrets[0])
            .create();

        await support.expectAcceptAndBroadcast(multiSignatureFunds, multiSignatureFunds[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(multiSignatureFunds[0].id);

        // Submit a vote
        const voteTransaction = TransactionFactory.vote()
            .withSenderPublicKey(multiSigPublicKey)
            .withPassphraseList(passphrases)
            .create();

        await support.expectAcceptAndBroadcast(voteTransaction, voteTransaction[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(voteTransaction[0].id);
    });
});
