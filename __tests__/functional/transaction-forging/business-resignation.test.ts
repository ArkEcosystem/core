import { Identities } from "@arkecosystem/crypto";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

const { passphrase } = support.passphrases;

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Business resignation", () => {
    it("should broadcast, accept and forge it", async () => {
        // Initial Funds
        const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(initialFunds.id).toBeForged();

        // Registering a business
        let businessRegistration = TransactionFactory.businessRegistration({
            name: "ark",
            website: "ark.io",
        })
            .withPassphrase(secrets[0])
            .createOne();

        await expect(businessRegistration).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(businessRegistration.id).toBeForged();

        // Resigning a business
        let businessResignation = TransactionFactory.businessResignation()
            .withPassphrase(secrets[0])
            .createOne();

        await expect(businessResignation).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(businessResignation.id).toBeForged();

        // Reject a second resignation
        businessResignation = TransactionFactory.businessResignation()
            .withPassphrase(secrets[0])
            .createOne();

        await expect(businessResignation).toBeRejected();
        await support.snoozeForBlock(1);
        await expect(businessResignation.id).not.toBeForged();

        // Reject a new registration
        businessRegistration = TransactionFactory.businessRegistration({
            name: "ark",
            website: "ark.io",
        })
            .withPassphrase(secrets[0])
            .createOne();

        await expect(businessRegistration).toBeRejected();
        await support.snoozeForBlock(1);
        await expect(businessRegistration.id).not.toBeForged();
    });
});
