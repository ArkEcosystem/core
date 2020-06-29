"use strict";

const testUtils = require("../../../../lib/utils/test-utils");
const utils = require("./utils");

describe("Check that the business was registered", () => {
    it("should have set the wallet business attribute", async () => {
        const walletResponse = await testUtils.GET(`wallets/${utils.wallets.businessRegistration.publicKey}`);
        testUtils.expectSuccessful(walletResponse);

        const wallet = walletResponse.data.data;
        expect(wallet).toBeObject();

        const business = wallet.attributes.business;
        expect(business).toBeObject();
        expect(business.businessAsset.name).toBe(utils.businessRegistrationAsset.name);
        expect(business.businessAsset.website).toBe(utils.businessRegistrationAsset.website);
    });
});
