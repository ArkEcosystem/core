import "jest-extended";

import Hapi from "@hapi/hapi";
import { NodeController } from "@packages/core-api/src/controllers/node";
import { CryptoSuite, Interfaces } from "@packages/core-crypto";
import { Application, Container, Providers } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { Generators, Mocks } from "@packages/core-test-framework/src";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";

import { initApp, ItemResponse } from "../__support__";

const crypto = new CryptoSuite.CryptoSuite(Generators.generateCryptoConfigRaw());

let app: Application;
let controller: NodeController;

beforeEach(() => {
    app = initApp(crypto);

    // Triggers registration of indexes
    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    controller = app.resolve<NodeController>(NodeController);
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
                avg: "15",
                min: "10",
                max: "20",
                sum: "500",
            };

            Mocks.TransactionRepository.setFeeStatistics([feeStatistics]);

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
