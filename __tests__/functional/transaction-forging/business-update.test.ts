import { Identities } from "@arkecosystem/crypto";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

const { passphrase } = support.passphrases;

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Business update", () => {
    it("should broadcast, accept and forge it", async () => {
        // Initial Funds
        const initialFunds = TransactionFactory.transfer(
            Identities.Address.fromPassphrase(passphrase),
            100 * 1e8,
        )
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

        // Updating a business
        const businessUpdate = TransactionFactory.businessUpdate({
            name: "google2",
        })
            .withPassphrase(secrets[0])
            .createOne();

        await expect(businessUpdate).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(businessUpdate.id).toBeForged();
    });

    it("should broadcast, accept and forge it ", async () => {
        // Resigning a business
        const businessResignation = TransactionFactory.businessResignation()
            .withPassphrase(secrets[0])
            .createOne();

        await expect(businessResignation).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(businessResignation.id).toBeForged();

        // Updating a business
        const businessUpdate = TransactionFactory.businessUpdate({
            name: "google3",
        })
            .withPassphrase(secrets[0])
            .createOne();

        expect(businessUpdate).toBeRejected();
        await support.snoozeForBlock(1);
        await expect(businessUpdate.id).not.toBeForged();
    });
});
