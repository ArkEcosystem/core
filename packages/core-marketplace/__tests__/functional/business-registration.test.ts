// @ts-ignore
import { Identities } from "@arkecosystem/crypto";
import * as support from "../../../../__tests__/functional/transaction-forging/__support__";
// @ts-ignore
import { TransactionFactory } from "../../../../__tests__/helpers";
// @ts-ignore
import { secrets } from "../../../../__tests__/utils/config/testnet/delegates.json";
// import { MarketplaceTrxFactory } from "./helper";

// @ts-ignore
const { passphrase } = support.passphrases;

//
// beforeAll(support.setUp);
// afterAll(support.tearDown);

describe("Transaction Forging - Delegate Registration", () => {
    // it("should broadcast, accept and forge it [Signed with 1 Passphase]", async () => {
    //   // Initial Funds
    //   const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
    //     .withPassphrase(secrets[0])
    //     .createOne();
    //
    //   await expect(initialFunds).toBeAccepted();
    //   await support.snoozeForBlock(1);
    //   await expect(initialFunds.id).toBeForged();
    // });
});
