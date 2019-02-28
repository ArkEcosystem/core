import "jest-extended";

import { resolve } from "path";
import { fileLoader } from "../../../../../packages/core-container/src/config/loaders";
import { Network } from "../../../../../packages/core-container/src/config/network";

const stubConfigPath = resolve(__dirname, "../../__stubs__/config");

const stubConfig = {
    delegates: require(resolve(__dirname, "../../__stubs__/config/delegates")),
    peers: require(resolve(__dirname, "../../__stubs__/config/peers")),
    plugins: require(resolve(__dirname, "../../__stubs__/config/plugins")),
};

beforeEach(() => {
    process.env.CORE_PATH_CONFIG = stubConfigPath;
});

afterEach(() => {
    delete process.env.CORE_PATH_CONFIG;
});

describe("File Loader", () => {
    it("should fail without a config", async () => {
        await expect(fileLoader.setUp(null)).rejects.toThrowError("Invalid network configuration provided.");
    });

    it("should succeed with a config", async () => {
        const { config } = await fileLoader.setUp(Network.setUp({}));

        expect(config.delegates).toEqual(stubConfig.delegates);
        expect(config.peers).toEqual(stubConfig.peers);
    });
});
