import "jest-extended";

import { ServiceProvider as CoreApiServiceProvider } from "@packages/core-api/src";
import { defaults } from "@packages/core-api/src/defaults";
import { PortsResource } from "@packages/core-api/src/resources";
import { Application, Container, Providers } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Mocks } from "@packages/core-test-framework";

import { initApp } from "../__support__";

let resource: PortsResource;
let app: Application;

beforeEach(() => {
    app = initApp();

    app.unbind(Identifiers.ServiceProviderRepository);
    app.bind(Identifiers.ServiceProviderRepository).toConstantValue(
        Mocks.ServiceProviderRepository.serviceProviderRepository,
    );
});

beforeEach(() => {
    resource = app.resolve<PortsResource>(PortsResource);
});

describe("PortsResource", () => {
    describe("raw", () => {
        it("should return raw object", async () => {
            expect(resource.raw({})).toEqual({});
        });
    });

    describe("transform", () => {
        beforeEach(async () => {
            const coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

            const pluginConfiguration = app.get<Providers.PluginConfiguration>(
                Container.Identifiers.PluginConfiguration,
            );

            // @ts-ignore
            defaults.enabled = true;
            // @ts-ignore
            defaults.port = 4003;
            const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-api", defaults);

            coreApiServiceProvider.setConfig(instance);

            await coreApiServiceProvider.register();
            coreApiServiceProvider.name = () => {
                return "@arkecosystem/core-api";
            };

            Mocks.ServiceProviderRepository.setServiceProviders([coreApiServiceProvider]);
        });

        it("should return transformed object", async () => {
            expect(resource.transform({})).toEqual({ "@arkecosystem/core-api": 4003 });
        });

        it("should return transformed object with server port", async () => {
            // @ts-ignore
            defaults.server.enabled = true;
            // @ts-ignore
            defaults.server.port = 4003;

            expect(resource.transform({})).toEqual({ "@arkecosystem/core-api": 4003 });
        });
    });
});
