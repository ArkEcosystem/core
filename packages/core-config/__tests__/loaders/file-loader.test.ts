import "jest-extended";

import { resolve } from "path";
import { FileLoader } from "../../src/loaders";

const stubConfigPath = resolve(__dirname, "../__stubs__");

const stubConfig = {
    delegates: require(resolve(__dirname, "../__stubs__/delegates")),
    genesisBlock: require(resolve(__dirname, "../__stubs__/genesisBlock")),
    network: require(resolve(__dirname, "../__stubs__/network")),
};

let loader;
beforeEach(() => {
    loader = new FileLoader();
    process.env.ARK_PATH_CONFIG = stubConfigPath;
    process.env.ARK_NETWORK = JSON.stringify(stubConfig.network);
});

afterEach(() => {
    delete process.env.ARK_PATH_CONFIG;
});

describe("Config Loader", () => {
    it("should fail without a config", async () => {
        try {
            await loader.setUp();
        } catch (error) {
            expect(error.message).toEqual("undefined (object) is required");
        }
    });

    it("should succeed with a config", async () => {
        const result = await loader.setUp(stubConfig);

        expect(loader.delegates).toEqual(stubConfig.delegates);
        expect(loader.genesisBlock).toEqual(stubConfig.genesisBlock);
        expect(loader.network).toContainAllKeys([
            ...Object.keys(stubConfig.network.network),
            ...["milestones", "dynamicFees"],
        ]);
    });
});
