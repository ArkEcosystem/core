"use strict";

const testUtils = require("../../../../lib/utils/test-utils");
const utils = require("./utils");
const { Enums } = require("@arkecosystem/crypto");

describe("Check confirmed and unconfirmed transactions", () => {
    it("should have no unconfirmed transaction", async () => {
        const response = await testUtils.GET("transactions/unconfirmed", {}, 1);
        testUtils.expectSuccessful(response);
        const transactions = response.data.data;

        expect(transactions.length).toBe(0);
    });

    it("should have valid transactions forged and invalid not forged", async () => {
        const response = await testUtils.GET("transactions");
        testUtils.expectSuccessful(response);
        const transactions = response.data.data;
        
        // valid transaction was accepted
        const lockTransactions = transactions.filter(tx => tx.recipient === utils.randomWallet1.address);
        expect(lockTransactions.length).toBe(1);

        expect(
            transactions.filter(tx =>
                tx.type === Enums.TransactionType.HtlcRefund && tx.asset.refund.lockTransactionId === lockTransactions[0].id
            ).length
        ).toBe(1);
    });
});
