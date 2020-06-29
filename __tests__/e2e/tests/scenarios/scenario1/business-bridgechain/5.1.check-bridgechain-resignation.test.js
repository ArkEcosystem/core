"use strict";

const testUtils = require("../../../../lib/utils/test-utils");
const utils = require("./utils");

describe("Check that the bridgechain was resigned", () => {
    it("should have the wallet bridgechain attribute resigned", async () => {
        const walletResponse = await testUtils.GET(`wallets/${utils.wallets.businessRegistration.publicKey}`);
        testUtils.expectSuccessful(walletResponse);

        const wallet = walletResponse.data.data;
        expect(wallet).toBeObject();

        const business = wallet.attributes.business;
        expect(business).toBeObject();
        expect(business.bridgechains[utils.bridgechainRegistrationAsset.genesisHash]).toBeObject();
        expect(business.bridgechains[utils.bridgechainRegistrationAsset.genesisHash].resigned).toBeTrue();
    });
});
