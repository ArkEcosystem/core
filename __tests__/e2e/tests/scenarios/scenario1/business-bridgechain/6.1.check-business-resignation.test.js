"use strict";

const testUtils = require("../../../../lib/utils/test-utils");
const utils = require("./utils");

describe("Check that the business was resigned", () => {
    it("should have the business resigned", async () => {
        const businessResponse = await testUtils.GET("businesses");
        testUtils.expectSuccessful(businessResponse);

        const businesses = businessResponse.data.data;
        expect(businesses).toBeArrayOfSize(1);
        expect(businesses[0].isResigned).toBeTrue();
    });
});
