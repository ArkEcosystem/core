import { Identities } from "@arkecosystem/crypto";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

const { passphrase, secondPassphrase } = support.passphrases;

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Transfer", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphase]", async () => {
        const transfer = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase))
            .withPassphrase(secrets[0])
            .create();

        await support.expectAcceptAndBroadcast(transfer, transfer[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(transfer[0].id);
    });

    it("should broadcast, accept and forge it [Signed with 2 Passphrases]", async () => {
        // Funds to register a second passphrase
        const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 50 * 1e8)
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
        const transfer = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase))
            .withPassphrasePair(support.passphrases)
            .create();

        await support.expectAcceptAndBroadcast(transfer, transfer[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(transfer[0].id);
    });
});
