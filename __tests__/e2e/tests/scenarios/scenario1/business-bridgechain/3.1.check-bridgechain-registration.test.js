"use strict";

const testUtils = require("../../../../lib/utils/test-utils");
const utils = require("./utils");

describe("Check that the bridgechain was registered", () => {
    it("should have set the wallet bridgechain attribute", async () => {
        const walletResponse = await testUtils.GET(`wallets/${utils.wallets.businessRegistration.publicKey}`);
        testUtils.expectSuccessful(walletResponse);

        const wallet = walletResponse.data.data;
        expect(wallet).toBeObject();

        const business = wallet.attributes.business;
        expect(business).toBeObject();
        expect(business.bridgechains).toEqual({
            [utils.bridgechainRegistrationAsset.genesisHash]: {
                bridgechainAsset: {
                    name: utils.bridgechainRegistrationAsset.name,
                    seedNodes: utils.bridgechainRegistrationAsset.seedNodes,
                    genesisHash: utils.bridgechainRegistrationAsset.genesisHash,
                    bridgechainRepository: utils.bridgechainRegistrationAsset.bridgechainRepository,
                    ports: utils.bridgechainRegistrationAsset.ports,
                    bridgechainAssetRepository: utils.bridgechainRegistrationAsset.bridgechainAssetRepository,
                }
            }
        });
    });
});
