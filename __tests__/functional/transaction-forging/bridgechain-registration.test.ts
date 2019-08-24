import { Identities } from "@arkecosystem/crypto";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

const { passphrase } = support.passphrases;

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Bridgechain registration", () => {
    it("should broadcast, accept and forge it ", async () => {
        // Initial Funds
        const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(initialFunds.id).toBeForged();

        // Registering a business
        const businessRegistration = TransactionFactory.businessRegistration({
            name: "arkecosystem",
            website: "ark.io",
        })
            .withPassphrase(secrets[0])
            .createOne();

        await expect(businessRegistration).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(businessRegistration.id).toBeForged();

        // Registering a bridgechain
        const bridgechainRegistration = TransactionFactory.bridgechainRegistration({
            name: "cryptoProject",
            seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
            genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
            bridgechainRepository: "somerepository",
        })
            .withPassphrase(secrets[0])
            .createOne();

        await expect(bridgechainRegistration).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(bridgechainRegistration.id).toBeForged();
    });

    it("should broadcast, accept and forge it again", async () => {
        // Registering a bridgechain again
        const bridgechainRegistration = TransactionFactory.bridgechainRegistration({
            name: "cryptoProject",
            seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
            genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
            bridgechainRepository: "somerepository",
        })
            .withPassphrase(secrets[0])
            .createOne();

        await expect(bridgechainRegistration).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(bridgechainRegistration.id).toBeForged();
    });

    it("should reject bridgechain registration, because business resigned", async () => {
        // Business resignation
        const businessResignation = TransactionFactory.businessResignation()
            .withPassphrase(secrets[0])
            .createOne();

        await expect(businessResignation).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(businessResignation.id).toBeForged();

        // Bridgechain resignation
        const bridgechainRegistration = TransactionFactory.bridgechainRegistration({
            name: "cryptoProject",
            seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
            genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
            bridgechainRepository: "somerepository",
        })
            .withPassphrase(secrets[0])
            .createOne();

        expect(bridgechainRegistration).toBeRejected();
        await support.snoozeForBlock(1);
        await expect(bridgechainRegistration.id).not.toBeForged();
    });
});
