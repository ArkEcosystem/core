import "jest-extended";

import { resolve } from "path";
import { fileLoader } from "../../../src/config/loaders";
import { Network } from "../../../src/config/network";

const stubConfigPath = resolve(__dirname, "../../__stubs__/config");

const stubConfig = {
    delegates: require(resolve(__dirname, "../../__stubs__/config/delegates")),
    dynamicFees: require(resolve(__dirname, "../../__stubs__/config/network/dynamic-fees")),
    genesisBlock: require(resolve(__dirname, "../../__stubs__/config/genesisBlock")),
    milestones: require(resolve(__dirname, "../../__stubs__/config/network/milestones")),
    network: require(resolve(__dirname, "../../__stubs__/config/network/network")),
    peers: require(resolve(__dirname, "../../__stubs__/config/peers")),
};

beforeEach(() => {
    process.env.ARK_PATH_CONFIG = stubConfigPath;
});

afterEach(() => {
    delete process.env.ARK_PATH_CONFIG;
});

describe("Config Loader", () => {
    it("should fail without a config", async () => {
        await expect(fileLoader.setUp(null)).rejects.toThrowError("Invalid network configuration provided.");
    });

    it("should succeed with a config", async () => {
        const { files } = await fileLoader.setUp(Network.setUp({}));

        expect(files.delegates).toEqual(stubConfig.delegates);
        expect(files.genesisBlock).toEqual(stubConfig.genesisBlock);
        expect(files.peers).toEqual(stubConfig.peers);
    });
});
