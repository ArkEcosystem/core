"use strict";

const testUtils = require("../../../../lib/utils/test-utils");
const utils = require("./utils");

describe("Check that the business was registered", () => {
    it("should have the business registered", async () => {
        const businessResponse = await testUtils.GET("businesses");
        testUtils.expectSuccessful(businessResponse);

        const businesses = businessResponse.data.data;
        expect(businesses).toBeArrayOfSize(1);
        expect(businesses[0].name).toBe(utils.businessRegistrationAsset.name);
        expect(businesses[0].website).toBe(utils.businessRegistrationAsset.website);
        expect(businesses[0].publicKey).toBe(utils.wallets.businessRegistration.publicKey);
    });

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
