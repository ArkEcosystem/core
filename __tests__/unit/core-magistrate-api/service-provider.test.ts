import "jest-extended";

import { Identifiers, Server, ServiceProvider as CoreApiServiceProvider } from "@packages/core-api/src";
import { defaults } from "@packages/core-api/src/defaults";
import { Application, Container, Providers } from "@packages/core-kernel";
import { ServiceProvider } from "@packages/core-magistrate-api/src";
import { Managers } from "@packages/crypto";

let app: Application;

beforeEach(() => {
    app = new Application(new Container.Container());

    app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();

    app.bind(Container.Identifiers.StateStore).toConstantValue({});

    app.bind(Container.Identifiers.BlockchainService).toConstantValue({});

    app.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue({});

    app.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue({});

    app.bind(Container.Identifiers.WalletRepository).toConstantValue({});

    app.bind(Container.Identifiers.PeerNetworkMonitor).toConstantValue({});

    app.bind(Container.Identifiers.PeerRepository).toConstantValue({});

    app.bind(Container.Identifiers.DatabaseRoundRepository).toConstantValue({});

    app.bind(Container.Identifiers.TransactionPoolQuery).toConstantValue({});

    app.bind(Container.Identifiers.TransactionPoolProcessorFactory).toConstantValue({});

    app.bind(Container.Identifiers.TransactionPoolProcessor).toConstantValue({});

    app.bind(Container.Identifiers.BlockHistoryService).toConstantValue({});

    app.bind(Container.Identifiers.TransactionHistoryService).toConstantValue({});

    app.bind(Container.Identifiers.TransactionHandlerRegistry).toConstantValue({});

    app.bind(Container.Identifiers.LogService).toConstantValue({});

    app.bind(Container.Identifiers.StandardCriteriaService).toConstantValue({});

    app.bind(Container.Identifiers.PaginationService).toConstantValue({});
});

describe("ServiceProvider", () => {
    let serviceProvider: ServiceProvider;

    it("should register", async () => {
        const coreApiServiceProvider = app.resolve<CoreApiServiceProvider>(CoreApiServiceProvider);

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const instance: Providers.PluginConfiguration = pluginConfiguration.from("core-api", defaults);

        coreApiServiceProvider.setConfig(instance);

        await expect(coreApiServiceProvider.register()).toResolve();

        expect(app.isBound<Server>(Identifiers.HTTP)).toBeTrue();

        serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

        await expect(serviceProvider.register()).toResolve();
    });

    it("should not be required", async () => {
        await expect(serviceProvider.required()).resolves.toBeFalse();
    });

    describe("API", () => {
        let server;
        let route;

        beforeEach(() => {
            serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

            route = {
                settings: {
                    handler: jest.fn().mockReturnValue({}),
                },
            };

            server = {
                getRoute: jest.fn().mockReturnValue(route),
            };
        });

        describe("NodeFees", () => {
            it("should return original response when AIP36 not set", async () => {
                Managers.configManager.getMilestone = jest.fn().mockReturnValue({});
                // @ts-ignore
                serviceProvider.extendApiNodeFees(server);

                await expect(route.settings.handler({})).resolves.toEqual({});
            });

            it("should return entity fees in response when AIP36 is set", async () => {
                Managers.configManager.getMilestone = jest.fn().mockReturnValue({
                    aip36: true,
                });
                // @ts-ignore
                serviceProvider.extendApiNodeFees(server);

                await expect(route.settings.handler({})).resolves.toEqual({
                    data: {
                        "2": {
                            entityRegistration: {
                                avg: "5000000000",
                                max: "5000000000",
                                min: "5000000000",
                                sum: "0",
                            },
                            entityResignation: {
                                avg: "500000000",
                                max: "500000000",
                                min: "500000000",
                                sum: "0",
                            },
                            entityUpdate: {
                                avg: "500000000",
                                max: "500000000",
                                min: "500000000",
                                sum: "0",
                            },
                        },
                    },
                });
            });
        });

        describe("TransactionFees", () => {
            it("should return original response when AIP36 not set", async () => {
                Managers.configManager.getMilestone = jest.fn().mockReturnValue({});
                // @ts-ignore
                serviceProvider.extendApiTransactionsFees(server);

                await expect(route.settings.handler({})).resolves.toEqual({});
            });

            it("should return entity fees in response when AIP36 is set", async () => {
                Managers.configManager.getMilestone = jest.fn().mockReturnValue({
                    aip36: true,
                });
                // @ts-ignore
                serviceProvider.extendApiTransactionsFees(server);

                await expect(route.settings.handler({})).resolves.toEqual({
                    data: {
                        "2": {
                            entityRegistration: "5000000000",
                            entityResignation: "500000000",
                            entityUpdate: "500000000",
                        },
                    },
                });
            });
        });
    });
});
