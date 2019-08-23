import { Identities } from "@arkecosystem/crypto";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

const { passphrase } = support.passphrases;

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Business registration", () => {
    it("should broadcast, accept and forge it", async () => {
        // Initial Funds
        const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(initialFunds.id).toBeForged();

        // Registering a business
        const businessRegistration = TransactionFactory.businessRegistration({
            name: "google",
            website: "www.google.com",
        })
            .withPassphrase(secrets[0])
            .createOne();

        await expect(businessRegistration).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(businessRegistration.id).toBeForged();
    });

    it("should be rejected, because wallet is already a business", async () => {

        // Registering a business again
        const businessRegistration = TransactionFactory.businessRegistration({
            name: "google",
            website: "www.google.com",
        })
            .withPassphrase(secrets[0])
            .createOne();

        await expect(businessRegistration).toBeRejected();
        await support.snoozeForBlock(1);
        await expect(businessRegistration.id).not.toBeForged();

    });
});
