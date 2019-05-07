import { Address, PublicKey } from "@arkecosystem/crypto";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

const { passphrase, secondPassphrase } = support.passphrases;

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Vote", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphase]", async () => {
        // Initial Funds
        const initialFunds = TransactionFactory.transfer(Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
            .create();

        await support.expectAcceptAndBroadcast(initialFunds, initialFunds[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(initialFunds[0].id);

        // Submit a vote
        const transactions = TransactionFactory.vote(PublicKey.fromPassphrase(secrets[0]))
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
        const initialFunds = TransactionFactory.transfer(Address.fromPassphrase(passphrase), 100 * 1e8)
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
        const vote = TransactionFactory.vote(PublicKey.fromPassphrase(secrets[0]))
            .withPassphrasePair({ passphrase, secondPassphrase })
            .create();

        await support.expectAcceptAndBroadcast(vote, vote[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(vote[0].id);
    });
});
