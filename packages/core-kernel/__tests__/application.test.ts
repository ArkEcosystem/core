import "jest-extended";

import { resolve } from "path";
import { Application } from "../src/application";

const config = {
    env: "dummy",
    version: "2.1.0",
    token: "ark",
    network: "dummy",
    paths: {
        data: resolve(__dirname, "./__fixtures__/data"),
        config: resolve(__dirname, "./__fixtures__/config"),
        cache: resolve(__dirname, "./__fixtures__/cache"),
        log: resolve(__dirname, "./__fixtures__/log"),
        temp: resolve(__dirname, "./__fixtures__/temp"),
    },
};

let app: Application;
beforeEach(() => {
    app = new Application();

    app.bootstrap(config);
});

describe("Application", () => {
    it("should be booted", () => {
        expect(app.has("event-emitter")).toBeTrue();
    });

    it("config", () => {
        expect(app.config<string>("key")).toBeUndefined();

        app.config("key", "value");

        expect(app.config<string>("key")).toBe("value");
    });

    it("version", () => {
        expect(app.version()).toBeString();
    });

    it("dataPath", () => {
        expect(app.dataPath()).toBe(config.paths.data);
    });

    it("useDataPath", () => {
        app.useDataPath(config.paths.data);

        expect(app.dataPath()).toBe(config.paths.data);
    });

    it("configPath", () => {
        expect(app.configPath()).toBe(config.paths.config);
    });

    it("useConfigPath", () => {
        app.useConfigPath(config.paths.config);

        expect(app.configPath()).toBe(config.paths.config);
    });

    it("cachePath", () => {
        expect(app.cachePath()).toBe(config.paths.cache);
    });

    it("useCachePath", () => {
        app.useCachePath(config.paths.cache);

        expect(app.cachePath()).toBe(config.paths.cache);
    });

    it("logPath", () => {
        expect(app.logPath()).toBe(config.paths.log);
    });

    it("useLogPath", () => {
        app.useLogPath(config.paths.log);

        expect(app.logPath()).toBe(config.paths.log);
    });

    it("tempPath", () => {
        expect(app.tempPath()).toBe(config.paths.temp);
    });

    it("useTempPath", () => {
        app.useTempPath(config.paths.temp);

        expect(app.tempPath()).toBe(config.paths.temp);
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
