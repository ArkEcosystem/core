"use strict";

const testUtils = require("../../../../lib/utils/test-utils");
const utils = require("./utils");
const { Enums } = require("@arkecosystem/crypto");

describe("Check confirmed and unconfirmed transactions", () => {
    it("should have valid transactions forged and invalid not forged", async () => {
        const response = await testUtils.GET("transactions");
        testUtils.expectSuccessful(response);
        const transactions = response.data.data;

        // valid transaction was accepted
        expect(transactions.filter(tx => tx.recipient === utils.randomWallet1.address).length).toBe(1);

        // invalid transactions were not accepted
        expect(transactions.filter(tx => tx.recipient === utils.randomWallet2.address).length).toBe(0);
    });
});
