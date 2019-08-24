import { Identities } from "@arkecosystem/crypto";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

const { passphrase } = support.passphrases;

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Bridgechain registration", () => {
    it("should broadcast, accept and forge it", async () => {
        // Initial Funds
        const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(initialFunds.id).toBeForged();

        // Business registration
        const businessRegistration = TransactionFactory.businessRegistration({
            name: "ark",
            website: "ark.io",
        })
            .withPassphrase(secrets[0])
            .createOne();

        await expect(businessRegistration).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(businessRegistration.id).toBeForged();

        // Bridgechain registration
        const bridgechainRegistration = TransactionFactory.bridgechainRegistration({
            name: "cryptoProject",
            seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
            genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
            bridgechainRepository: "www.repository.com/myorg/myrepo",
        })
            .withPassphrase(secrets[0])
            .createOne();

        await expect(bridgechainRegistration).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(bridgechainRegistration.id).toBeForged();

        // Bridgechain resignation
        let bridgechainResignation = TransactionFactory.bridgechainResignation("1")
            .withPassphrase(secrets[0])
            .createOne();
        await expect(bridgechainResignation).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(bridgechainResignation.id).toBeForged();

        bridgechainResignation = TransactionFactory.bridgechainResignation("1")
            .withPassphrase(secrets[0])
            .createOne();

        expect(bridgechainResignation).toBeRejected();
        await support.snoozeForBlock(1);
        await expect(bridgechainResignation.id).not.toBeForged();
    });
});
