import { Address } from "@arkecosystem/crypto";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

const { passphrase, secondPassphrase } = support.passphrases;

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Transfer", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphase]", async () => {
        const transactions = TransactionFactory.transfer(Address.fromPassphrase(passphrase))
            .withPassphrase(secrets[0])
            .create();

        await support.expectAcceptAndBroadcast(transactions, transactions[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(transactions[0].id);
    });

    it.only("should broadcast, accept and forge it [Signed with 2 Passphases]", async () => {
        // Funds to register a second passphrase
        const initialFunds = TransactionFactory.transfer(Address.fromPassphrase(passphrase), 50)
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

        // Submit a transfer with 2 passprhases
        const transactions = TransactionFactory.transfer(Address.fromPassphrase(passphrase))
            .withPassphrases(support.passphrases)
            .create();

        await support.expectAcceptAndBroadcast(transactions, transactions[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(transactions[0].id);
    });
});
