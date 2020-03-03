import { Identities, Managers } from "@arkecosystem/crypto";
import delay from "delay";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

beforeAll(async () => {
    await support.setUp();
    Managers.configManager.setFromPreset("testnet");
});
afterAll(support.tearDown);

describe("Transaction Forging - Multipayment", () => {
    /*
     * Scenario :
     * - init bob and alice wallet
     * - send an initial tx from bob to index his wallet in tx pool
     * - send a multipayment from alice including bob in payment recipients
     * - send bob funds received from multipayment to a random address
     * - this last transaction from bob fails if pool wallet is not updated correctly bu multipayment tx
     */
    const bobPassphrase = "bob pass phrase";
    const bobAddress = Identities.Address.fromPassphrase(bobPassphrase, 23);
    const bobInitialFund = 50 * 1e8; // 50 ARK

    const alicePassphrase = "alice pass phrase";
    const aliceAddress = Identities.Address.fromPassphrase(alicePassphrase, 23);
    const aliceInitialFund = 2500 * 1e8; // 2500 ARK

    const randomAddress = Identities.Address.fromPassphrase("ran dom addr", 23);

    it("should accept and forge all the transactions", async () => {
        const initialTxToBob = TransactionFactory.transfer(bobAddress, bobInitialFund)
            .withPassphrase(secrets[1])
            .createOne();
        const initialTxToAlice = TransactionFactory.transfer(aliceAddress, aliceInitialFund)
            .withPassphrase(secrets[2])
            .createOne();
        await expect(initialTxToBob).toBeAccepted();
        await support.forge([initialTxToBob, initialTxToAlice]);
        await delay(1000);

        const initialTxFromBob = TransactionFactory.transfer(bobAddress, 1)
            .withPassphrase(bobPassphrase)
            .createOne();
        await expect(initialTxFromBob).toBeAccepted();
        await support.forge([initialTxFromBob]);
        await delay(1000);

        const multipaymentToBobAndAlice = TransactionFactory.multiPayment([
            {
                recipientId: bobAddress,
                amount: (2000 * 1e8).toFixed(), // 2000 ARK
            },
            {
                recipientId: aliceAddress,
                amount: (10 * 1e8).toFixed(), // 10 ARK
            },
        ])
            .withPassphrase(alicePassphrase)
            .createOne();
        await support.forge([multipaymentToBobAndAlice]);
        await delay(1000);
        await expect(multipaymentToBobAndAlice.id).toBeForged();

        const bobTransfer = TransactionFactory.transfer(randomAddress, 2000 * 1e8)
            .withPassphrase(bobPassphrase)
            .createOne();
        await expect(bobTransfer).toBeAccepted();
        await support.forge([bobTransfer]);
        await delay(1000);
    });
});
