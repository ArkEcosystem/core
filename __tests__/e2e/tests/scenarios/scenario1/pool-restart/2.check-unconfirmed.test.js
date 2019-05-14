"use strict";

const testUtils = require("../../../../lib/utils/test-utils");
const utils = require("./utils");

describe("Check unconfirmed transactions", () => {
    it("should have the 2 transactions unconfirmed", async () => {
        const response = await testUtils.GET("transactions/unconfirmed", {}, 1);
        testUtils.expectSuccessful(response);
        const transactions = response.data.data;

        const txToRandomRecipient = transactions.filter(
            transaction => transaction.recipient === utils.randomRecipient.address,
        );
        const txToRandomRecipient2 = transactions.filter(
            transaction => transaction.recipient === utils.randomRecipient2.address,
        );

        expect(transactions.length).toBe(2);
        expect(txToRandomRecipient.length).toBe(1);
        expect(txToRandomRecipient2.length).toBe(1);
    });
});
