import { Identities } from "@arkecosystem/crypto";
import * as support from "../../../../__tests__/functional/transaction-forging/__support__";
import { secrets } from "../../../../__tests__/utils/config/testnet/delegates.json";
import { MarketplaceTransactionFactory } from "./helper";

const { passphrase } = support.passphrases;

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Business update", () => {
    it("should broadcast, accept and forge it", async () => {
        // Initial Funds
        const initialFunds = MarketplaceTransactionFactory.transfer(
            Identities.Address.fromPassphrase(passphrase),
            100 * 1e8,
        )
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(initialFunds.id).toBeForged();

        // Registering a business
        const businessRegistration = MarketplaceTransactionFactory.businessRegistration({
            name: "google",
            website: "www.google.com",
        })
            .withPassphrase(secrets[0])
            .createOne();

        await expect(businessRegistration).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(businessRegistration.id).toBeForged();

        // Registering a business
        const businessUpdate = MarketplaceTransactionFactory.businessUpdate({
            name: "google2",
        })
            .withPassphrase(secrets[0])
            .createOne();

        await expect(businessUpdate).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(businessUpdate.id).toBeForged();
    });
});
