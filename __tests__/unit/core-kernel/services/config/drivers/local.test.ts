import "jest-extended";
import { resolve } from "path";

import { LocalConfigLoader } from "@packages/core-kernel/src/services/config/drivers/local";
import { Application } from "@packages/core-kernel/src/application";
import { ConfigRepository } from "@packages/core-kernel/src/services/config/repository";
import { Container, Identifiers, interfaces } from "@packages/core-kernel/src/ioc";
import { ServiceProviderRepository } from "@packages/core-kernel/src/providers";
import { MemoryEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/memory";
import {
    ApplicationConfigurationCannotBeLoaded,
    EnvironmentConfigurationCannotBeLoaded,
} from "@packages/core-kernel/src/exceptions/config";

let app: Application;
let container: interfaces.Container;
let configLoader: LocalConfigLoader;

beforeEach(() => {
    container = new Container();

    app = new Application(container);
    app.bind(Identifiers.ConfigRepository)
        .to(ConfigRepository)
        .inSingletonScope();
    app.bind(Identifiers.EventDispatcherService).toConstantValue(new MemoryEventDispatcher());
    app.bind(Identifiers.ServiceProviderRepository).toConstantValue(new ServiceProviderRepository());
    app.bind(Identifiers.ConfigFlags).toConstantValue({});
    app.bind(Identifiers.ConfigPlugins).toConstantValue({});

    container.snapshot();

    configLoader = app.resolve<LocalConfigLoader>(LocalConfigLoader);
});

afterEach(() => container.restore());

describe("LocalConfigLoader", () => {
    it("should throw if it fails to fail the application configuration", async () => {
        app.rebind("path.config").toConstantValue("does-not-exist");

        await expect(configLoader.loadConfiguration()).rejects.toThrowError(
            new ApplicationConfigurationCannotBeLoaded(),
        );
    });

    it("should throw if it fails to fail the environment variables", async () => {
        app.rebind("path.config").toConstantValue("does-not-exist");

        await expect(configLoader.loadEnvironmentVariables()).rejects.toThrowError(
            new EnvironmentConfigurationCannotBeLoaded(),
        );
    });

    it("should load the application configuration without cryptography", async () => {
        app.rebind("path.config").toConstantValue(resolve(__dirname, "../../../__stubs__/config"));

        await configLoader.loadConfiguration();

        expect(app.get<ConfigRepository>(Identifiers.ConfigRepository).get("crypto.genesisBlock")).toBeUndefined();
        expect(app.get<ConfigRepository>(Identifiers.ConfigRepository).get("crypto.exceptions")).toBeUndefined();
        expect(app.get<ConfigRepository>(Identifiers.ConfigRepository).get("crypto.milestones")).toBeUndefined();
        expect(app.get<ConfigRepository>(Identifiers.ConfigRepository).get("crypto.network")).toBeUndefined();
    });

    it("should load the application configuration with cryptography", async () => {
        app.rebind("path.config").toConstantValue(resolve(__dirname, "../../../__stubs__/config-with-crypto"));

        await configLoader.loadConfiguration();

        expect(app.get<ConfigRepository>(Identifiers.ConfigRepository).get("crypto.genesisBlock")).not.toBeUndefined();
        expect(app.get<ConfigRepository>(Identifiers.ConfigRepository).get("crypto.exceptions")).not.toBeUndefined();
        expect(app.get<ConfigRepository>(Identifiers.ConfigRepository).get("crypto.milestones")).not.toBeUndefined();
        expect(app.get<ConfigRepository>(Identifiers.ConfigRepository).get("crypto.network")).not.toBeUndefined();
    });
});
