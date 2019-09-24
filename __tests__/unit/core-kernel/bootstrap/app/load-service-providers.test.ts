import "jest-extended";

import { resolve } from "path";

import { Application } from "@packages/core-kernel/src/application";
import { Container, interfaces, Identifiers } from "@packages/core-kernel/src/ioc";
import { ConfigRepository } from "@packages/core-kernel/src/services/config";
import { ServiceProvider, ServiceProviderRepository } from "@packages/core-kernel/src/providers";
import { LoadServiceProviders } from "@packages/core-kernel/src/bootstrap/app";

class StubServiceProvider extends ServiceProvider {
    public async register(): Promise<void> {}
}

let app: Application;
let container: interfaces.Container;
let configRepository: ConfigRepository;
let serviceProviderRepository: ServiceProviderRepository;

beforeEach(() => {
    container = new Container();

    app = new Application(container);

    app.bind(Identifiers.ConfigRepository)
        .to(ConfigRepository)
        .inSingletonScope();

    app.bind(Identifiers.ServiceProviderRepository)
        .to(ServiceProviderRepository)
        .inSingletonScope();

    configRepository = app.get<ConfigRepository>(Identifiers.ConfigRepository);

    serviceProviderRepository = app.get<ServiceProviderRepository>(Identifiers.ServiceProviderRepository);

    container.snapshot();
});

afterEach(() => container.restore());

describe("LoadServiceProviders", () => {
    it("should bootstrap with defaults", async () => {
        configRepository.merge({
            app: { plugins: [{ package: resolve(__dirname, "../../__stubs__/stub-plugin-with-defaults") }] },
        });

        serviceProviderRepository.set("stub", new StubServiceProvider());

        await app.resolve<LoadServiceProviders>(LoadServiceProviders).bootstrap();
    });

    it("should bootstrap without defaults", async () => {
        configRepository.merge({
            app: { plugins: [{ package: resolve(__dirname, "../../__stubs__/stub-plugin") }] },
        });

        serviceProviderRepository.set("stub", new StubServiceProvider());

        await app.resolve<LoadServiceProviders>(LoadServiceProviders).bootstrap();
    });
});
