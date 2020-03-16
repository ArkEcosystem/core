import "jest-extended";

import Hapi from "@hapi/hapi";
import { Application, Container, Providers } from "@packages/core-kernel";
import { initApp, ItemResponse } from "../__support__";
import { NodeController } from "@packages/core-api/src/controllers/node";
import { BlockchainMocks, NetworkMonitorMocks, StateStoreMocks, TransactionRepositoryMocks } from "./mocks";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Interfaces, Managers, Transactions } from "@packages/crypto";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { Generators } from "@packages/core-test-framework/src";

let app: Application;
let controller: NodeController;

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    Managers.configManager.setConfig(config);

    app = initApp();

    app
        .unbind(Container.Identifiers.StateStore);
    app
        .bind(Container.Identifiers.StateStore)
        .toConstantValue(StateStoreMocks.stateStore);

    app
        .unbind(Container.Identifiers.TransactionRepository);
    app
        .bind(Container.Identifiers.TransactionRepository)
        .toConstantValue(TransactionRepositoryMocks.transactionRepository);

    app
        .unbind(Container.Identifiers.BlockchainService);
    app
        .bind(Container.Identifiers.BlockchainService)
        .toConstantValue(BlockchainMocks.blockchain);

    app
        .unbind(Container.Identifiers.PeerNetworkMonitor);
    app
        .bind(Container.Identifiers.PeerNetworkMonitor)
        .toConstantValue(NetworkMonitorMocks.networkMonitor);

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
        mockBlockData= {
            id: "1",
            height: 1,
        };

        let mockBlock: Partial<Interfaces.IBlock> = {
            data: mockBlockData as Interfaces.IBlockData
        };

        BlockchainMocks.setMockBlock(mockBlock);
    });

    describe("status", () => {
        it("should return node status", async () => {
            let response = <ItemResponse>(await controller.status(undefined, undefined));

            expect(response.data).toEqual(expect.objectContaining(
                {
                    synced: true,
                    now: 1,
                }
            ));
        });
    });

    describe("syncing", () => {
        it("should return syncing status", async () => {
            let response = <ItemResponse>(await controller.syncing(undefined, undefined));

            expect(response.data).toEqual(expect.objectContaining(
                {
                    syncing: false,
                    height: mockBlockData.height,
                    id: mockBlockData.id,
                }
            ));
        });
    });

    describe("configuration", () => {
        it("should return node configuration", async () => {
            app.bind(Identifiers.ApplicationVersion).toConstantValue("3.0.0");

            app
                .get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration)
                .set("dynamicFees", { enabled: true });

            let response = <any>(await controller.configuration(undefined, undefined));

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
            let response = <any>(await controller.configurationCrypto());

            expect(response.data.network).toBeDefined();
            expect(response.data.exceptions).toBeDefined();
            expect(response.data.milestones).toBeDefined();
            expect(response.data.genesisBlock).toBeDefined();
        });
    });

    describe("fees", () => {
        it("should return transactions fees", async () => {
            let feeStatistics: TransactionRepositoryMocks.FeeStatistics = {
                type: 1,
                typeGroup: 1,
                avg: "15",
                min: "10",
                max: "20",
                sum: "500",
            };

            TransactionRepositoryMocks.setFeeStatistics([feeStatistics]);

            let request: Hapi.Request = {
                query: {
                    days: 5,
                }
            };

            let response = <any>(await controller.fees(request));

            expect(response.data[feeStatistics.type.toString()]).toBeDefined();
        });
    });
});
