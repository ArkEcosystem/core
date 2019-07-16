import { Identities } from "@arkecosystem/crypto";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

const { passphrase } = support.passphrases;

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Business Registration", () => {

    it("should broadcast, accept and forge it", async () => {
        // Initial Funds
        const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(initialFunds.id).toBeForged();


        // Business registration
        const transactions = TransactionFactory.businessRegistration("My Business Name","www.website.com")
            .withPassphrase(passphrase)
            .createOne();

        await expect(transactions).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(transactions.id).toBeForged();

    });


});
