import { Identities } from "@arkecosystem/crypto";
import * as support from "../../../../__tests__/functional/transaction-forging/__support__";
import { secrets } from "../../../../__tests__/utils/config/testnet/delegates.json";
import { MarketplaceTrxFactory } from "./helper";

const { passphrase } = support.passphrases;

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Business resignation", () => {
    it("should broadcast, accept and forge it", async () => {
        // Initial Funds
        const initialFunds = MarketplaceTrxFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(initialFunds.id).toBeForged();

        // Registering a business
        const businessRegistration = MarketplaceTrxFactory.businessRegistration({
            name: "google",
            website: "www.google.com",
        })
            .withPassphrase(secrets[0])
            .createOne();

        await expect(businessRegistration).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(businessRegistration.id).toBeForged();

        // Resigning a business
        const businessResignation = MarketplaceTrxFactory
            .businessResignation()
            .withPassphrase(secrets[0])
            .createOne();

        await expect(businessResignation).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(businessResignation.id).toBeForged();
    });

    it("should be rejected, becuase wallet is already resigned", async () => {
        // Resigning a business again
        const businessResignation = MarketplaceTrxFactory
            .businessResignation()
            .withPassphrase(secrets[0])
            .createOne();

        await expect(businessResignation).toBeRejected();
        await support.snoozeForBlock(1);
        await expect(businessResignation.id).not.toBeForged();
    });

    it("should broadcast, accept and forge it, because wallet is resigned and can register again", async ()=> {
        // Registering a business again
        const businessRegistration = MarketplaceTrxFactory.businessRegistration({
            name: "google",
            website: "www.google.com",
        })
            .withPassphrase(secrets[0])
            .createOne();

        await expect(businessRegistration).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(businessRegistration.id).toBeForged();
    });
});
