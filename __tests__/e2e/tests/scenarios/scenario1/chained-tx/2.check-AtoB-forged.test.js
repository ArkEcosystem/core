"use strict";

const testUtils = require("../../../../lib/utils/test-utils");
const utils = require("./utils");

describe("Check confirmed and unconfirmed transactions", () => {
    it("should have our 1st transaction forged only", async () => {
        const response = await testUtils.GET("transactions");
        testUtils.expectSuccessful(response);
        const transactions = response.data.data;

        const txAToB = transactions.filter(transaction => transaction.sender === utils.a.address);
        const txBToC = transactions.filter(transaction => transaction.sender === utils.b.address);

        expect(txAToB.length).toBe(1); // 1st transaction was forged
        expect(txBToC.length).toBe(0); // 2nd transaction was not forged
    });
});
