import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Second Signature Registration", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphase]", async () => {
        const transactions = support.generateSecondSignature(secrets[0], support.passphrases.secondPassphrase);
        await support.expectAcceptAndBroadcast(transactions, transactions[0].id);
        await support.snoozeForBlock(1000);
        await support.expectTransactionForged(transactions[0].id);
    });
});
