import "jest-extended";

import Hapi from "@hapi/hapi";
import { NodeController } from "@packages/core-api/src/controllers/node";
import { Application, Container, Providers } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { Mocks } from "@packages/core-test-framework";
import { Generators } from "@packages/core-test-framework/src";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Interfaces, Managers, Transactions } from "@packages/crypto";

import { initApp, ItemResponse } from "../__support__";

let app: Application;
let controller: NodeController;

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    Managers.configManager.setConfig(config);

    app = initApp();
    app.bind(Identifiers.TransactionHistoryService).toConstantValue(null);

    // Triggers registration of indexes
    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    controller = app.resolve<NodeController>(NodeController);
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

describe("NodeController", () => {
    let mockBlockData: Partial<Interfaces.IBlockData>;

    beforeEach(() => {
        mockBlockData = {
            id: "1",
            height: 1,
        };

        const mockBlock = {
            data: mockBlockData,
        };

        Mocks.NetworkMonitor.setNetworkHeight(5);
        Mocks.Blockchain.setBlock(mockBlock as Partial<Interfaces.IBlock>);
    });

    describe("status", () => {
        it("should return node status", async () => {
            const response = (await controller.status(undefined, undefined)) as ItemResponse;

            expect(response.data).toEqual(
                expect.objectContaining({
                    synced: true,
                    now: 1,
                }),
            );
        });

        it("should return node status when last block is undefined", async () => {
            Mocks.Blockchain.setBlock(undefined);
            const response = (await controller.status(undefined, undefined)) as ItemResponse;

            expect(response.data).toEqual(
                expect.objectContaining({
                    synced: true,
                    now: 0,
                    blocksCount: 0,
                }),
            );
        });
    });

    describe("syncing", () => {
        it("should return syncing status", async () => {
            Mocks.Blockchain.setBlock(undefined);
            const response = (await controller.syncing(undefined, undefined)) as ItemResponse;

            expect(response.data).toEqual(
                expect.objectContaining({
                    syncing: false,
                    height: 0,
                    id: undefined,
                }),
            );
        });

        it("should return syncing status when last block is undefined", async () => {
            const response = (await controller.syncing(undefined, undefined)) as ItemResponse;

            expect(response.data).toEqual(
                expect.objectContaining({
                    syncing: false,
                    height: mockBlockData.height,
                    id: mockBlockData.id,
                }),
            );
        });
    });

    describe("configuration", () => {
        beforeEach(() => {
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set(
                "maxTransactionsInPool",
                15000,
            );
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set(
                "maxTransactionsPerSender",
                150,
            );
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set(
                "maxTransactionsPerRequest",
                40,
            );
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set(
                "maxTransactionAge",
                2700,
            );
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set(
                "maxTransactionBytes",
                2000000,
            );
        });

        it("should return node configuration", async () => {
            app.bind(Identifiers.ApplicationVersion).toConstantValue("3.0.0");

            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set("dynamicFees", {
                enabled: true,
            });

            const response = await controller.configuration(undefined, undefined);

            expect(response.data.core).toBeDefined();
            expect(response.data.nethash).toBeDefined();
            expect(response.data.slip44).toBeDefined();
            expect(response.data.wif).toBeDefined();
            expect(response.data.token).toBeDefined();
            expect(response.data.symbol).toBeDefined();
            expect(response.data.explorer).toBeDefined();
            expect(response.data.version).toBeDefined();
            expect(response.data.ports).toBeDefined();
            expect(response.data.constants).toBeDefined();
            expect(response.data.transactionPool).toBeDefined();
            expect(response.data.transactionPool.dynamicFees).toBeDefined();
            expect(response.data.transactionPool.maxTransactionsInPool).toBeNumber();
            expect(response.data.transactionPool.maxTransactionsPerSender).toBeNumber();
            expect(response.data.transactionPool.maxTransactionsPerRequest).toBeNumber();
            expect(response.data.transactionPool.maxTransactionAge).toBeNumber();
            expect(response.data.transactionPool.maxTransactionBytes).toBeNumber();
        });

        it("should return node configuration when dynamicFees are not enabled", async () => {
            app.bind(Identifiers.ApplicationVersion).toConstantValue("3.0.0");

            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set("dynamicFees", {
                enabled: false,
            });

            const response = await controller.configuration(undefined, undefined);

            expect(response.data.core).toBeDefined();
            expect(response.data.nethash).toBeDefined();
            expect(response.data.slip44).toBeDefined();
            expect(response.data.wif).toBeDefined();
            expect(response.data.token).toBeDefined();
            expect(response.data.symbol).toBeDefined();
            expect(response.data.explorer).toBeDefined();
            expect(response.data.version).toBeDefined();
            expect(response.data.ports).toBeDefined();
            expect(response.data.constants).toBeDefined();
            expect(response.data.transactionPool).toBeDefined();
            expect(response.data.transactionPool.dynamicFees).toBeDefined();
            expect(response.data.transactionPool.maxTransactionsInPool).toBeNumber();
            expect(response.data.transactionPool.maxTransactionsPerSender).toBeNumber();
            expect(response.data.transactionPool.maxTransactionsPerRequest).toBeNumber();
            expect(response.data.transactionPool.maxTransactionAge).toBeNumber();
            expect(response.data.transactionPool.maxTransactionBytes).toBeNumber();
        });
    });

    describe("configurationCrypto", () => {
        it("should return all configurations", async () => {
            const response = await controller.configurationCrypto();

            expect(response.data.network).toBeDefined();
            expect(response.data.exceptions).toBeDefined();
            expect(response.data.milestones).toBeDefined();
            expect(response.data.genesisBlock).toBeDefined();
        });
    });

    describe("fees", () => {
        it("should return transactions fees", async () => {
            const feeStatistics: Mocks.TransactionRepository.FeeStatistics = {
                type: 1,
                typeGroup: 1,
                avg: 15,
                min: 10,
                max: 20,
                sum: 500,
            };

            Mocks.TransactionRepository.setFeeStatistics([feeStatistics, feeStatistics]);

            const request: Hapi.Request = {
                query: {
                    days: 5,
                },
            };

            const response = await controller.fees(request);

            expect(response.data[feeStatistics.type.toString()]).toBeDefined();
        });
    });
});
