"use strict";

const testUtils = require("../../../../lib/utils/test-utils");
const utils = require("./utils");
const { Enums } = require("@arkecosystem/crypto");

describe("Check confirmed and unconfirmed transactions", () => {
    it("should have valid transactions forged and invalid not forged", async () => {
        const response = await testUtils.GET("transactions");
        testUtils.expectSuccessful(response);
        const transactions = response.data.data;

        // htlcSender and htlcNotSender sent valid htlc refund transactions
        for (const senderName of ["htlcSender", "htlcNotSender"]) {
            expect(transactions.filter(
                tx => tx.sender === utils[senderName].address && tx.type === Enums.TransactionType.HtlcRefund
            ).length).toBe(1);
        }

        // htlcBeforeExpiration sent invalid htlc refund transaction
        expect(transactions.filter(transaction => transaction.sender === utils.htlcBeforeExpiration.address).length).toBe(0);
    });
});
