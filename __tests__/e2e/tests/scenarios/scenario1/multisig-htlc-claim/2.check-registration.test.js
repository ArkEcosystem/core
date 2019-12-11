"use strict";

const testUtils = require("../../../../lib/utils/test-utils");
const utils = require("./utils");
const shared = require("./shared");

describe("Check confirmed and unconfirmed transactions", () => {
    it("should have all lock transactions forged", async () => {
        const response = await testUtils.GET("transactions");
        testUtils.expectSuccessful(response);
        const transactions = response.data.data;

        expect(transactions.filter(transaction => transaction.sender === utils.multiSender1.address).length).toBe(1);

    });
});
