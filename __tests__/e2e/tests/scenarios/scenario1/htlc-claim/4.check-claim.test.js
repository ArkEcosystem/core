"use strict";

const testUtils = require("../../../../lib/utils/test-utils");
const utils = require("./utils");
const shared = require("./shared");

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
        
        // recipients 1 and htlcNotRecipient sent valid htlc claim transactions
        for (const senderName of ["htlcRecipient1", "htlcNotRecipient"]) {
            expect(transactions.filter(transaction => transaction.sender === utils[senderName].address).length).toBe(1);
        }

        // recipients 2 and 4 sent invalid htlc claim transactions
        for (const senderName of ["htlcRecipient2", "htlcRecipient4"]) {
            expect(transactions.filter(transaction => transaction.sender === utils[senderName].address).length).toBe(1);
        }
    });
});
