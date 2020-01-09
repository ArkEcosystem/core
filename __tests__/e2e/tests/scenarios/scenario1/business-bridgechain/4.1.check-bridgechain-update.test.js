"use strict";

const testUtils = require("../../../../lib/utils/test-utils");
const utils = require("./utils");

describe("Check that the bridgechain was updated", () => {
    it("should have the bridgechain updated", async () => {
        const bridgechainResponse = await testUtils.GET("bridgechains");
        testUtils.expectSuccessful(bridgechainResponse);

        const bridgechains = bridgechainResponse.data.data;
        expect(bridgechains).toBeArrayOfSize(1);
        expect(bridgechains[0].name).toBe(utils.bridgechainRegistrationAsset.name);
        expect(bridgechains[0].genesisHash).toBe(utils.bridgechainRegistrationAsset.genesisHash);
        expect(bridgechains[0].seedNodes).toEqual(utils.bridgechainUpdateAsset.seedNodes);
        expect(bridgechains[0].bridgechainRepository).toBe(utils.bridgechainUpdateAsset.bridgechainRepository);
        expect(bridgechains[0].bridgechainAssetRepository).toBe(utils.bridgechainUpdateAsset.bridgechainAssetRepository);
        expect(bridgechains[0].ports).toEqual(utils.bridgechainUpdateAsset.ports);
    });
});
