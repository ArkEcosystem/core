import "jest-extended";
import { resolve } from "path";

import { LocalConfigLoader } from "@packages/core-kernel/src/services/config/drivers/local";
import { Application } from "@packages/core-kernel/src/application";
import { ConfigRepository } from "@packages/core-kernel/src/services/config/repository";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import { MemoryEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/memory";
import { JoiValidator } from "@packages/core-kernel/src/services/validation/drivers/joi";
import {
    ApplicationConfigurationCannotBeLoaded,
    EnvironmentConfigurationCannotBeLoaded,
} from "@packages/core-kernel/src/exceptions/config";

let app: Application;
let configLoader: LocalConfigLoader;

beforeEach(() => {
    app = new Application(new Container());
    app.bind(Identifiers.EventDispatcherService).toConstantValue(new MemoryEventDispatcher());
    app.bind(Identifiers.ConfigFlags).toConstantValue({});
    app.bind(Identifiers.ConfigPlugins).toConstantValue({});

    app.bind(Identifiers.ValidationService).to(JoiValidator);

    configLoader = app.resolve<LocalConfigLoader>(LocalConfigLoader);
});

describe("LocalConfigLoader", () => {
    it("should throw if it fails to fail the application configuration", async () => {
        app.rebind("path.config").toConstantValue("does-not-exist");

        await expect(configLoader.loadConfiguration()).rejects.toThrowError(ApplicationConfigurationCannotBeLoaded);
    });

    it("should throw if it fails to fail the environment variables", async () => {
        app.rebind("path.config").toConstantValue("does-not-exist");

        await expect(configLoader.loadEnvironmentVariables()).rejects.toThrowError(
            EnvironmentConfigurationCannotBeLoaded,
        );
    });

    it("should load the application configuration without cryptography", async () => {
        app.rebind("path.config").toConstantValue(resolve(__dirname, "../../../__stubs__/config"));

        await configLoader.loadConfiguration();

        expect(() => app.get<ConfigRepository>(Identifiers.ConfigRepository).get("crypto.genesisBlock")).toThrow();
        expect(() => app.get<ConfigRepository>(Identifiers.ConfigRepository).get("crypto.exceptions")).toThrow();
        expect(() => app.get<ConfigRepository>(Identifiers.ConfigRepository).get("crypto.milestones")).toThrow();
        expect(() => app.get<ConfigRepository>(Identifiers.ConfigRepository).get("crypto.network")).toThrow();
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
