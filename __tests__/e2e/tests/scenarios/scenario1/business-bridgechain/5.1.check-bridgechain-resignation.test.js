"use strict";

const testUtils = require("../../../../lib/utils/test-utils");
const utils = require("./utils");

describe("Check that the bridgechain was resigned", () => {
    it("should have the bridgechain resigned", async () => {
        const bridgechainResponse = await testUtils.GET("bridgechains");
        testUtils.expectSuccessful(bridgechainResponse);

        const bridgechains = bridgechainResponse.data.data;
        expect(bridgechains).toBeArrayOfSize(1);
        expect(bridgechains[0].isResigned).toBeTrue();
    });
});
