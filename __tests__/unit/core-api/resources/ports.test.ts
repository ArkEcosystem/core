import "jest-extended";

import { CryptoSuite } from "@arkecosystem/core-crypto";
import { ServiceProvider as CoreApiServiceProvider } from "@packages/core-api/src";
import { defaults } from "@packages/core-api/src/defaults";
import { PortsResource } from "@packages/core-api/src/resources";
import { Application, Container, Providers } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { Mocks } from "@packages/core-test-framework/src";

import { initApp } from "../__support__";

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("devnet"));

let resource: PortsResource;
let app: Application;

beforeEach(() => {
    app = initApp(crypto);

    app.unbind(Identifiers.ServiceProviderRepository);
    app.bind(Identifiers.BlockHistoryService).toConstantValue({});
    app.bind(Identifiers.TransactionHistoryService).toConstantValue({});
    app.bind(Identifiers.ServiceProviderRepository).toConstantValue(Mocks.ServiceProviderRepository.instance);
});

afterEach(() => {
    try {
        crypto.TransactionManager.TransactionTools.TransactionRegistry.deregisterTransactionType(
            MagistrateTransactions.BusinessRegistrationTransaction,
        );
        crypto.TransactionManager.TransactionTools.TransactionRegistry.deregisterTransactionType(
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
