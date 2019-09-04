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
    container.snapshot();

    app = new Application(container);

    serviceProviderRepository = new ServiceProviderRepository();
    app.bind(Identifiers.ServiceProviderRepository).toConstantValue(serviceProviderRepository);
});

afterEach(() => container.restore());

describe("LoadServiceProviders", () => {
    it("should bootstrap with defaults", async () => {
        configRepository = new ConfigRepository({
            app: { plugins: [{ package: resolve(__dirname, "../../__stubs__/stub-plugin-with-defaults") }] },
        });

        app.bind(Identifiers.ConfigRepository).toConstantValue(configRepository);

        serviceProviderRepository.set("stub", new StubServiceProvider());

        await app.resolve<LoadServiceProviders>(LoadServiceProviders).bootstrap();
    });

    it("should bootstrap without defaults", async () => {
        configRepository = new ConfigRepository({
            app: { plugins: [{ package: resolve(__dirname, "../../__stubs__/stub-plugin") }] },
        });

        app.bind(Identifiers.ConfigRepository).toConstantValue(configRepository);

        serviceProviderRepository.set("stub", new StubServiceProvider());

        await app.resolve<LoadServiceProviders>(LoadServiceProviders).bootstrap();
    });
});
