"use strict";

const delay = require("delay");
const testUtils = require("../../../../lib/utils/test-utils");
const utils = require("./utils");

describe("Check forged transactions", () => {
    it("should have our first transaction forged but not our 2nd one", async () => {
        const response = await testUtils.GET("transactions");
        testUtils.expectSuccessful(response);
        const transactions = response.data.data;

        const txToRandomRecipient = transactions.filter(
            transaction => transaction.recipient === utils.randomRecipient.address,
        );
        const txToRandomRecipient2 = transactions.filter(
            transaction => transaction.recipient === utils.randomRecipient2.address,
        );

        expect(txToRandomRecipient.length).toBe(1); // 1st transaction was forged
        expect(txToRandomRecipient2.length).toBe(0); // 2nd transaction was not forged
    });

    it("should have the 2nd transaction still unconfirmed on node1 restart", async () => {
        const response = await retryUnconfirmedAPI(10);

        testUtils.expectSuccessful(response);
        const transactions = response.data.data;

        expect(transactions.length).toBe(1);
        expect(transactions[0].recipient).toBe(utils.randomRecipient2.address);

        async function retryUnconfirmedAPI(retryCount) {
            if (retryCount < 1) {
                return null;
            }

            const response = await testUtils.GET("transactions/unconfirmed", {}, 1);
            if (response) {
                return response;
            }

            await delay(1000);
            return retryUnconfirmedAPI(--retryCount);
        }
    });
});
