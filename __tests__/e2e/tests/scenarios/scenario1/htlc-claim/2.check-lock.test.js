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

    it("should have all lock transactions forged", async () => {
        const response = await testUtils.GET("transactions");
        testUtils.expectSuccessful(response);
        const transactions = response.data.data;
        
        for (const recipientName of ["htlcRecipient1", "htlcRecipient2", "htlcRecipient3", "htlcRecipient4"]) {
            expect(transactions.filter(transaction => transaction.recipient === utils[recipientName].address).length).toBe(1);
        }
    });
});
