import "jest-extended";

import { Transactions } from "@arkecosystem/crypto";
import { ServiceProvider as CoreApiServiceProvider } from "@packages/core-api/src";
import { defaults } from "@packages/core-api/src/defaults";
import { PortsResource } from "@packages/core-api/src/resources";
import { Application, Container, Providers } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { Mocks } from "@packages/core-test-framework";

import { initApp } from "../__support__";

let resource: PortsResource;
let app: Application;

beforeEach(() => {
    app = initApp();

    app.unbind(Identifiers.ServiceProviderRepository);
    app.bind(Identifiers.StandardCriteriaService).toConstantValue({});
    app.bind(Identifiers.PaginationService).toConstantValue({});
    app.bind(Identifiers.BlockHistoryService).toConstantValue({});
    app.bind(Identifiers.TransactionHistoryService).toConstantValue({});
    app.bind(Identifiers.ServiceProviderRepository).toConstantValue(Mocks.ServiceProviderRepository.instance);
});

afterEach(() => {
    try {
        Transactions.TransactionRegistry.deregisterTransactionType(
            MagistrateTransactions.BusinessRegistrationTransaction,
        );
        Transactions.TransactionRegistry.deregisterTransactionType(
            MagistrateTransactions.BridgechainRegistrationTransaction,
        );
    } catch {}
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
        let coreApiServiceProvider;

        beforeEach(async () => {
            coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

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

        it("should not include port if disabled", async () => {
            const pluginConfiguration = app.get<Providers.PluginConfiguration>(
                Container.Identifiers.PluginConfiguration,
            );

            // @ts-ignore
            defaults.enabled = false;
            // @ts-ignore
            defaults.port = 4003;
            const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-api", defaults);

            coreApiServiceProvider.setConfig(instance);

            expect(resource.transform({})).toEqual({});
        });
    });
});
