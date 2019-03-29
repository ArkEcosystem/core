import { Address, PublicKey } from "@arkecosystem/crypto";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

const { passphrase, secondPassphrase } = support.passphrases;

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Vote", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphase]", async () => {
        // Initial Funds
        const initialFunds = support.generateTransfer(secrets[0], Address.fromPassphrase(passphrase), 100);
        await support.expectAcceptAndBroadcast(initialFunds, initialFunds[0].id);
        await support.snoozeForBlock(1000);
        await support.expectTransactionForged(initialFunds[0].id);

        // Submit a vote
        const transactions = support.generateVote(passphrase, PublicKey.fromPassphrase(secrets[0]));
        await support.expectAcceptAndBroadcast(transactions, transactions[0].id);
        await support.snoozeForBlock(1000);
        await support.expectTransactionForged(transactions[0].id);
    });

    it("should broadcast, accept and forge it [Signed with 2 Passphases]", async () => {
        // Make a fresh wallet for the second signature tests
        const passphrase = secondPassphrase;

        // Initial Funds
        const initialFunds = support.generateTransfer(secrets[0], Address.fromPassphrase(passphrase), 100);
        await support.expectAcceptAndBroadcast(initialFunds, initialFunds[0].id);
        await support.snoozeForBlock(1000);
        await support.expectTransactionForged(initialFunds[0].id);

        // Register a second passphrase
        const secondSignature = support.generateSecondSignature(passphrase, secondPassphrase);
        await support.expectAcceptAndBroadcast(secondSignature, secondSignature[0].id);
        await support.snoozeForBlock(1000);
        await support.expectTransactionForged(secondSignature[0].id);

        // Submit a vote
        const transactions = support.generateVote(
            { passphrase, secondPassphrase },
            PublicKey.fromPassphrase(secrets[0]),
        );
        await support.expectAcceptAndBroadcast(transactions, transactions[0].id);
        await support.snoozeForBlock(1000);
        await support.expectTransactionForged(transactions[0].id);
    });
});
