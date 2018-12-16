import "jest-extended";

import { resolve } from "path";
import { FileLoader } from "../../../src/config/loaders";
import { Network } from "../../../src/config/network";

const stubConfigPath = resolve(__dirname, "../../__stubs__/config");

const stubConfig = {
    delegates: require(resolve(__dirname, "../../__stubs__/config/delegates")),
    dynamicFees: require(resolve(__dirname, "../../__stubs__/config/network/dynamic-fees")),
    genesisBlock: require(resolve(__dirname, "../../__stubs__/config/genesisBlock")),
    milestones: require(resolve(__dirname, "../../__stubs__/config/network/milestones")),
    network: require(resolve(__dirname, "../../__stubs__/config/network/network")),
};

let loader;
beforeEach(() => {
    loader = new FileLoader();
    process.env.ARK_PATH_CONFIG = stubConfigPath;
});

afterEach(() => {
    delete process.env.ARK_PATH_CONFIG;
});

describe("Config Loader", () => {
    it("should fail without a config", async () => {
        await expect(loader.setUp()).rejects.toThrowError("Invalid network configuration provided.");
    });

    it("should succeed with a config", async () => {
        const network = Network.setUp({});

        await loader.setUp(network);

        expect(loader.delegates).toEqual(stubConfig.delegates);
        expect(loader.genesisBlock).toEqual(stubConfig.genesisBlock);
        expect(loader.network).toContainAllKeys([...Object.keys(stubConfig.network), ...["milestones", "dynamicFees"]]);
    });
});
