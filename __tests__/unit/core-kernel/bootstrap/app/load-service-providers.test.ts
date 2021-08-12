import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { LoadServiceProviders } from "@packages/core-kernel/src/bootstrap/app";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import { ServiceProvider, ServiceProviderRepository } from "@packages/core-kernel/src/providers";
import { ConfigRepository } from "@packages/core-kernel/src/services/config";
import { MemoryEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/memory";
import { resolve } from "path";

class StubServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}
}

let app: Application;
let configRepository: ConfigRepository;
let serviceProviderRepository: ServiceProviderRepository;

beforeEach(() => {
    app = new Application(new Container());

    app.bind(Identifiers.EventDispatcherService).to(MemoryEventDispatcher).inSingletonScope();

    configRepository = app.get<ConfigRepository>(Identifiers.ConfigRepository);
    serviceProviderRepository = app.get<ServiceProviderRepository>(Identifiers.ServiceProviderRepository);

    jest.spyOn(app, "dataPath").mockReturnValue(resolve(__dirname, "../../__stubs__"));
});

describe("LoadServiceProviders", () => {
    it("should bootstrap with defaults", async () => {
        configRepository.merge({
            app: { plugins: [{ package: "stub-plugin-with-defaults" }] },
        });

        serviceProviderRepository.set("stub", new StubServiceProvider());

        await app.resolve<LoadServiceProviders>(LoadServiceProviders).bootstrap();
    });

    it("should bootstrap without defaults", async () => {
        configRepository.merge({
            app: { plugins: [{ package: "stub-plugin" }] },
        });

        serviceProviderRepository.set("stub", new StubServiceProvider());

        await app.resolve<LoadServiceProviders>(LoadServiceProviders).bootstrap();
    });

    it("should throw if package doesn't exist", async () => {
        configRepository.merge({
            app: { plugins: [{ package: "non-existing-plugin" }] },
        });

        await expect(app.resolve<LoadServiceProviders>(LoadServiceProviders).bootstrap()).rejects.toThrowError(
            "Cannot find module 'non-existing-plugin'",
        );
    });

    it("should bootstrap if plugins path doesn't exist", async () => {
        jest.spyOn(app, "dataPath").mockReturnValue("/invalid/path");


        configRepository.merge({
            app: { plugins: [] },
        });

        await app.resolve<LoadServiceProviders>(LoadServiceProviders).bootstrap();
    })
});
