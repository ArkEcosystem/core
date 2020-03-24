import "jest-extended";
import { CoreOptions, CryptoOptions, Sandbox } from "@packages/core-test-framework/src/app";
import { ServiceProvider as CoreStateServiceProvider } from "@packages/core-state";
import { resolve } from "path";
import { Container } from "@packages/core-kernel";

describe("Sandbox", () => {
    it("should create app", async () => {
        let sandbox = new Sandbox();

        expect(sandbox.app).toBeDefined();
    });

    it("should boot", async () => {
        let sandbox = new Sandbox();

        let callback = jest.fn();

        await expect(sandbox.boot(callback)).toResolve();
        expect(callback).toHaveBeenCalled();
    });

    it("should boot with core options", async () => {
        let sandbox = new Sandbox();

        let callback = jest.fn();

        let coreOptions: CoreOptions = {
            flags: {
                network: "dummynet",
                token: "DARK",
            },
        };

        await expect(sandbox.withCoreOptions(coreOptions).boot(callback)).toResolve();
        expect(callback).toHaveBeenCalled();
    });

    it("should boot with crypto options", async () => {
        let sandbox = new Sandbox();

        let callback = jest.fn();

        let coreOptions: CryptoOptions = {
            flags: {
                network: "dummynet",
                premine: "15300000000000000",
                delegates: 51,
                blocktime: 8,
                maxTxPerBlock: 150,
                maxBlockPayload: 2097152,
                rewardHeight: 75600,
                rewardAmount: 200000000,
                pubKeyHash: 23,
                wif: 186,
                token: "DARK",
                symbol: "DѦ",
                explorer: "http://dexplorer.ark.io",
                distribute: true,
            },
        };

        await expect(sandbox.withCryptoOptions(coreOptions).boot(callback)).toResolve();
        expect(callback).toHaveBeenCalled();
    });

    it("should dispose", async () => {
        let sandbox = new Sandbox();

        let callback = jest.fn();

        await expect(sandbox.boot()).toResolve();
        await expect(sandbox.dispose(callback)).toResolve();
        expect(callback).toHaveBeenCalled();
    });

    it("should restore", async () => {
        let sandbox = new Sandbox();

        sandbox.snapshot();

        let testBinding = "test";

        sandbox.app.bind("test").toConstantValue(testBinding);

        expect(sandbox.app.get("test")).toBe(testBinding);

        sandbox.restore();

        expect(() => { sandbox.app.get("test") }).toThrowError();
    });

    it("should register service provider", async () => {
        let sandbox = new Sandbox();

        sandbox
            .app
            .bind(Container.Identifiers.EventDispatcherService)
            .toConstantValue({});

        let serviceProviderOptions = {
            name: "@arkecosystem/core-state",
            path: resolve(__dirname, "../../../../packages/core-state"),
            klass: CoreStateServiceProvider
        };

        expect(sandbox.registerServiceProvider(serviceProviderOptions)).toBe(sandbox);
    });
});
