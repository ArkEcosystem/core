import "jest-extended";
import { dirSync, setGracefulCleanup } from "tmp";

import { RemoteConfigLoader } from "@packages/core-kernel/src/services/config/drivers/remote";
import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers, interfaces } from "@packages/core-kernel/src/container";
import { ServiceProviderRepository } from "@packages/core-kernel/src/providers";
import { MemoryEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/memory";
import {
    ApplicationConfigurationCannotBeLoaded,
    EnvironmentConfigurationCannotBeLoaded,
} from "@packages/core-kernel/src/exceptions/config";

const configPath: string = dirSync().name;

let app: Application;
let container: interfaces.Container;
let configLoader: RemoteConfigLoader;

beforeEach(() => {
    container = new Container();
    container.snapshot();

    app = new Application(container);
    app.bind(Identifiers.EventDispatcherService).toConstantValue(new MemoryEventDispatcher());
    app.bind(Identifiers.ServiceProviderRepository).toConstantValue(new ServiceProviderRepository());
    app.bind("path.config").toConstantValue(configPath);

    configLoader = app.resolve<RemoteConfigLoader>(RemoteConfigLoader);
});

afterAll(() => setGracefulCleanup());

describe("RemoteConfigLoader", () => {
    it(".loadConfiguration", async () => {
        await expect(configLoader.loadConfiguration()).rejects.toThrowError(
            new ApplicationConfigurationCannotBeLoaded(),
        );
    });

    it(".loadEnvironmentVariables", async () => {
        await expect(configLoader.loadEnvironmentVariables()).rejects.toThrowError(
            new EnvironmentConfigurationCannotBeLoaded(),
        );
    });
});
