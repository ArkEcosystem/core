import { Container } from "@arkecosystem/core-kernel";
import { MissingCommonBlockError } from "@arkecosystem/core-p2p/src/errors";
import { Peer } from "@arkecosystem/core-p2p/src/peer";
import { PeerController } from "@arkecosystem/core-p2p/src/socket-server/controllers/peer";
import { getPeerConfig } from "@arkecosystem/core-p2p/src/socket-server/utils/get-peer-config";
import { Crypto, Managers } from "@arkecosystem/crypto";

Managers.configManager.getMilestone().aip11 = true; // for creating aip11 v2 transactions

describe("PeerController", () => {
    let peerController: PeerController;

    const container = new Container.Container();

    const logger = { warning: jest.fn(), debug: jest.fn(), info: jest.fn() };
    const peerStorage = { getPeers: jest.fn() };
    const database = { getCommonBlocks: jest.fn(), getBlocksForDownload: jest.fn() };
    const databaseInteractions = {
        getCommonBlocks: jest.fn(),
        getBlocksForDownload: jest.fn(),
    };
    const blockchain = {
        getLastBlock: jest.fn(),
        handleIncomingBlock: jest.fn(),
        pingBlock: jest.fn(),
        getLastDownloadedBlock: jest.fn(),
    };
    const createProcessor = jest.fn();
    const appPlugins = [{ package: "@arkecosystem/core-api", options: {} }];
    const coreApiServiceProvider = {
        name: () => "core-api",
        configDefaults: () => ({
            server: { http: { port: 4003 } },
        }),
    };
    const serviceProviders = { "@arkecosystem/core-api": coreApiServiceProvider };
    const configRepository = { get: () => appPlugins }; // get("app.plugins")
    const serviceProviderRepository = { get: (plugin) => serviceProviders[plugin] };
    const appGet = {
        [Container.Identifiers.BlockchainService]: blockchain,
        [Container.Identifiers.TransactionPoolProcessorFactory]: createProcessor,
        [Container.Identifiers.ConfigRepository]: configRepository,
        [Container.Identifiers.ServiceProviderRepository]: serviceProviderRepository,
    };
    const config = { getOptional: jest.fn().mockReturnValue(["127.0.0.1"]) }; // remoteAccess
    const app = {
        get: (key) => appGet[key],
        getTagged: () => config,
        version: () => "3.0.9",
        resolve: () => ({
            from: () => ({
                merge: () => ({
                    all: () => ({
                        server: { http: { port: "4003" } },
                        options: {
                            estimateTotalCount: true,
                        },
                    }),
                }),
            }),
        }),
    };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.PeerStorage).toConstantValue(peerStorage);
        container.bind(Container.Identifiers.DatabaseService).toConstantValue(database);
        container.bind(Container.Identifiers.DatabaseInteraction).toConstantValue(databaseInteractions);
        container.bind(Container.Identifiers.Application).toConstantValue(app);
    });

    beforeEach(() => {
        peerController = container.resolve<PeerController>(PeerController);
    });

    describe("getPeers", () => {
        it("should return the peers sorted by latency", () => {
            const peers = [
                new Peer("180.177.54.4", 4000),
                new Peer("181.177.54.4", 4000),
                new Peer("182.177.54.4", 4000),
                new Peer("183.177.54.4", 4000),
                new Peer("184.177.54.4", 4000),
            ];
            peers[0].latency = 197634;
            peers[1].latency = 120000;
            peers[2].latency = 117634;
            peers[3].latency = 297600;
            peers[4].latency = 1197634;
            peerStorage.getPeers = jest.fn().mockReturnValueOnce(peers);

            const peersBroadcast = peerController.getPeers({}, {});
            expect(peersBroadcast).toEqual(
                [peers[2], peers[1], peers[0], peers[3], peers[4]].map((p) => p.toBroadcast()),
            );
        });
    });

    describe("getCommonBlocks", () => {
        it("should return the last common block found and the last height", async () => {
            const request = { payload: { ids: ["123456789", "111116789"] } };
            databaseInteractions.getCommonBlocks = jest.fn().mockReturnValueOnce(request.payload.ids);
            const height = 1433;
            blockchain.getLastBlock = jest.fn().mockReturnValueOnce({ data: { height } });
            const commonBlocks = await peerController.getCommonBlocks(request, {});

            expect(commonBlocks).toEqual({
                common: request.payload.ids[1],
                lastBlockHeight: height,
            });
        });

        it("should throw MissingCommonBlockError when no common block found", async () => {
            const request = { payload: { ids: ["123456789", "111116789"] } };
            databaseInteractions.getCommonBlocks = jest.fn().mockReturnValueOnce([]);

            await expect(peerController.getCommonBlocks(request, {})).rejects.toBeInstanceOf(MissingCommonBlockError);
        });
    });

    describe("getStatus", () => {
        it("should return the status based on last block", async () => {
            const header = { id: "984003423092345907" };
            const height = 1987;
            const lastBlock = {
                data: { height },
                getHeader: () => header,
            };
            blockchain.getLastBlock = jest.fn().mockReturnValueOnce(lastBlock);
            const slotInfo = {
                forgingStatus: true,
                slotNumber: 344,
                startTime: 98700,
                endTime: 99000,
                blockTime: 8,
            };
            jest.spyOn(Crypto.Slots, "getSlotInfo").mockReturnValueOnce(slotInfo);

            const status = await peerController.getStatus({}, {});

            expect(status).toEqual({
                state: {
                    height,
                    forgingAllowed: slotInfo.forgingStatus,
                    currentSlot: slotInfo.slotNumber,
                    header,
                },
                config: getPeerConfig(app as any),
            });
        });

        it("should return height=0 and header={} when no last block found", async () => {
            blockchain.getLastBlock = jest.fn();
            const slotInfo = {
                forgingStatus: true,
                slotNumber: 344,
                startTime: 98700,
                endTime: 99000,
                blockTime: 8,
            };
            jest.spyOn(Crypto.Slots, "getSlotInfo").mockReturnValueOnce(slotInfo);

            const status = await peerController.getStatus({}, {});

            expect(status).toEqual({
                state: {
                    height: 0,
                    forgingAllowed: false,
                    currentSlot: 0,
                    header: {},
                },
                config: getPeerConfig(app as any),
            });
        });
    });
});
