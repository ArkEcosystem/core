"use strict";

const testUtils = require("../../../../lib/utils/test-utils");
const utils = require("./utils");

describe("Check that only each transaction was accepted", () => {
    it("should have 1 transaction accepted", async () => {
        const response = await testUtils.GET("transactions");
        testUtils.expectSuccessful(response);

        for(const txType of Object.keys(utils.wallets)) {
            const wallets = utils.wallets[txType];

            const txSent = response.data.data.filter(tx => tx.sender === wallets[0].address);
            expect(txSent.length).toBe(1);

            // ignore 2nd sign registration tx type - same as transaction2ndsig.action
            if (txType !== "secondSignRegistration") {
                const txSent2ndSign = response.data.data.filter(
                    tx => tx.type !== 1 && tx.sender === wallets[2].address, // ignore the initial 2nd signature registration
                );
                expect(txSent2ndSign.length).toBe(1);
            }
        }
    });
});
