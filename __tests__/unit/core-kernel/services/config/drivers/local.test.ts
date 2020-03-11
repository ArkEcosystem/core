import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import {
    ApplicationConfigurationCannotBeLoaded,
    EnvironmentConfigurationCannotBeLoaded,
} from "@packages/core-kernel/src/exceptions/config";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import { LocalConfigLoader } from "@packages/core-kernel/src/services/config/drivers/local";
import { ConfigRepository } from "@packages/core-kernel/src/services/config/repository";
import { MemoryEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/memory";
import { JoiValidator } from "@packages/core-kernel/src/services/validation/drivers/joi";
import { resolve } from "path";

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
    it("should throw if it fails to load the environment variables", async () => {
        app.rebind("path.config").toConstantValue(resolve(__dirname, "../../../__stubs__/config-empty"));

        await expect(configLoader.loadEnvironmentVariables()).rejects.toThrowError(
            EnvironmentConfigurationCannotBeLoaded,
        );
    });

    it("should throw if it fails to load the application configuration", async () => {
        app.rebind("path.config").toConstantValue(resolve(__dirname, "../../../__stubs__/config-empty"));

        const promise = configLoader.loadConfiguration();

        await expect(promise).rejects.toThrowError(ApplicationConfigurationCannotBeLoaded);
        await expect(promise).rejects.toThrow(
            "Unable to load the application configuration file. Failed to discovery any files matching [app.json, app.js].",
        );
    });

    it("should throw if it fails to validate the application configuration", async () => {
        app.rebind("path.config").toConstantValue(resolve(__dirname, "../../../__stubs__/config-invalid-app"));

        await expect(configLoader.loadConfiguration()).rejects.toThrowError(ApplicationConfigurationCannotBeLoaded);
    });

    it("should throw if it fails to validate the application peers configuration", async () => {
        app.rebind("path.config").toConstantValue(resolve(__dirname, "../../../__stubs__/config-invalid-peers"));

        await expect(configLoader.loadConfiguration()).rejects.toThrowError(ApplicationConfigurationCannotBeLoaded);
    });

    it("should throw if it fails to validate the application delegates configuration", async () => {
        app.rebind("path.config").toConstantValue(resolve(__dirname, "../../../__stubs__/config-invalid-delegates"));

        await expect(configLoader.loadConfiguration()).rejects.toThrowError(ApplicationConfigurationCannotBeLoaded);
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
