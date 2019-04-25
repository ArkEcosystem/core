"use strict";

const testUtils = require("../../../../lib/utils/test-utils");
const utils = require("./utils");

describe("Check confirmed and unconfirmed transactions", () => {
    it("should have no unconfirmed transaction", async () => {
        const response = await testUtils.GET("transactions/unconfirmed", {}, 1);
        testUtils.expectSuccessful(response);
        const transactions = response.data.data;

        expect(transactions.length).toBe(0); // transaction was removed from pool
    });

    it("should have all transactions forged", async () => {
        const response = await testUtils.GET("transactions");
        testUtils.expectSuccessful(response);
        const transactions = response.data.data;

        const txToB = transactions.filter(transaction => transaction.recipient === utils.b.address);
        const txToC = transactions.filter(transaction => transaction.recipient === utils.c.address);

        expect(txToB.length).toBe(1); // A => B transaction was forged
        expect(txToC.length).toBe(1); // B => C transaction was forged
    });
});
