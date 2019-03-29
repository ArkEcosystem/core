import { Address } from "@arkecosystem/crypto";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

const { passphrase, secondPassphrase } = support.passphrases;

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Transfer", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphase]", async () => {
        const transactions = support.generateTransfer(secrets[0], Address.fromPassphrase(passphrase));
        await support.expectAcceptAndBroadcast(transactions, transactions[0].id);
        await support.snoozeForBlock(1000);
        await support.expectTransactionForged(transactions[0].id);
    });

    it("should broadcast, accept and forge it [Signed with 2 Passphases]", async () => {
        // Funds to register a second passphrase
        const initialFunds = support.generateTransfer(secrets[0], Address.fromPassphrase(passphrase), 50);
        await support.expectAcceptAndBroadcast(initialFunds, initialFunds[0].id);
        await support.snoozeForBlock(1000);
        await support.expectTransactionForged(initialFunds[0].id);

        // Register a second passphrase
        const secondSignature = support.generateSecondSignature(passphrase, secondPassphrase);
        await support.expectAcceptAndBroadcast(secondSignature, secondSignature[0].id);
        await support.snoozeForBlock(1000);
        await support.expectTransactionForged(secondSignature[0].id);

        // Submit a transfer with 2 passprhases
        const transactions = support.generateTransfer(
            { passphrase, secondPassphrase },
            Address.fromPassphrase(passphrase),
        );
        await support.expectAcceptAndBroadcast(transactions, transactions[0].id);
        await support.snoozeForBlock(1000);
        await support.expectTransactionForged(transactions[0].id);
    });
});
