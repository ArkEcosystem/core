import "jest-extended";

import { Application } from "../src/application";

const config = {
    env: "dummy",
    version: "2.1.0",
    token: "ark",
    network: "dummy",
    paths: {
        data: "./data",
        config: "./config",
        cache: "./cache",
        log: "./log",
        temp: "./temp",
    },
};

let app: Application;
beforeEach(() => {
    app = new Application();

    app.bootstrapWith(config);
});

describe("Application", () => {
    it("version", () => {
        expect(app.version()).toBeString();
    });

    it("dataPath", () => {
        expect(app.dataPath()).toBe("./data");
    });

    it("useDataPath", () => {
        app.useDataPath("dummy");

        expect(app.dataPath()).toBe("dummy");
    });

    it("configPath", () => {
        expect(app.configPath()).toBe("./config");
    });

    it("useConfigPath", () => {
        app.useConfigPath("dummy");

        expect(app.configPath()).toBe("dummy");
    });

    it("cachePath", () => {
        expect(app.cachePath()).toBe("./cache");
    });

    it("useCachePath", () => {
        app.useCachePath("dummy");

        expect(app.cachePath()).toBe("dummy");
    });

    it("logPath", () => {
        expect(app.logPath()).toBe("./log");
    });

    it("useLogPath", () => {
        app.useLogPath("dummy");

        expect(app.logPath()).toBe("dummy");
    });

    it("tempPath", () => {
        expect(app.tempPath()).toBe("./temp");
    });

    it("useTempPath", () => {
        app.useTempPath("dummy");

        expect(app.tempPath()).toBe("dummy");
    });

    describe("isProduction", () => {
        it("should be true if the network is 'mainnet'", () => {
            app.useNetwork("mainnet");

            expect(app.isProduction()).toBeTrue();
        });

        it("should be false if the network is not 'mainnet'", () => {
            app.useNetwork("devnet");

            expect(app.isProduction()).toBeFalse();
        });

        it("should be true if the environment is 'production'", () => {
            app.useEnvironment("production");

            expect(app.isProduction()).toBeTrue();
        });

        it("should be false if the environment is not 'production'", () => {
            app.useEnvironment("development");

            expect(app.isProduction()).toBeFalse();
        });
    });

    describe("isDevelopment", () => {
        it("should be true if the network is 'devnet'", () => {
            app.useNetwork("devnet");

            expect(app.isDevelopment()).toBeTrue();
        });

        it("should be false if the network is not 'devnet'", () => {
            app.useNetwork("mainnet");

            expect(app.isDevelopment()).toBeFalse();
        });

        it("should be true if the environment is 'development'", () => {
            app.useEnvironment("development");

            expect(app.isDevelopment()).toBeTrue();
        });

        it("should be false if the environment is not 'development'", () => {
            app.useEnvironment("production");

            expect(app.isDevelopment()).toBeFalse();
        });
    });

    describe("runningTests", () => {
        it("should be true if the network is 'testnet'", () => {
            app.useNetwork("testnet");

            expect(app.runningTests()).toBeTrue();
        });

        it("should be false if the network is not 'testnet'", () => {
            app.useNetwork("mainnet");

            expect(app.runningTests()).toBeFalse();
        });

        it("should be true if the environment is 'test'", () => {
            app.useEnvironment("test");

            expect(app.runningTests()).toBeTrue();
        });

        it("should be false if the environment is not 'test'", () => {
            app.useEnvironment("production");

            expect(app.runningTests()).toBeFalse();
        });
    });
});
