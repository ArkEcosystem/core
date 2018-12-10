import { resolve } from "path";
import { Loader } from "../src/loader";

const stubConfigPath = resolve(__dirname, "./__stubs__");

const stubConfig = {
    delegates: require("./__stubs__/delegates"),
    genesisBlock: require("./__stubs__/genesisBlock"),
    network: require("./__stubs__/network"),
};

let loader;
beforeEach(() => {
    loader = new Loader();
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
        expect(loader.network).toEqual(stubConfig.network);
    });
});
