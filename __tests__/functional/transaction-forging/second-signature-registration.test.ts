import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Second Signature Registration", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphase]", async () => {
        const transactions = TransactionFactory.secondSignature(support.passphrases.secondPassphrase)
            .withPassphrase(secrets[0])
            .create();

        await support.expectAcceptAndBroadcast(transactions, transactions[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(transactions[0].id);
    });
});
