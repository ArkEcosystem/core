import { Container } from "@packages/core-kernel";
import { MissingCommonBlockError } from "@packages/core-p2p/src/errors";
import { Peer } from "@packages/core-p2p/src/peer";
import { PeerController } from "@packages/core-p2p/src/socket-server/controllers/peer";
import { getPeerConfig } from "@packages/core-p2p/src/socket-server/utils/get-peer-config";
import { Sandbox } from "@packages/core-test-framework";
import { Crypto, Managers } from "@packages/crypto";

Managers.configManager.getMilestone().aip11 = true; // for creating aip11 v2 transactions

describe("PeerController", () => {
    let sandbox: Sandbox;
    let peerController: PeerController;

    const logger = { warning: jest.fn(), debug: jest.fn(), info: jest.fn() };
    const peerRepository = { getPeers: jest.fn() };
    const database = { getCommonBlocks: jest.fn(), getBlocksForDownload: jest.fn() };
    const databaseInterceptor = {
        getCommonBlocks: jest.fn(),
        getBlocksForDownload: jest.fn(),
    };
    const blockchain = {
        getLastBlock: jest.fn(),
        handleIncomingBlock: jest.fn(),
        pingBlock: jest.fn(),
        getLastDownloadedBlock: jest.fn(),
    };

    beforeEach(() => {
        sandbox = new Sandbox();

        sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logger);
        sandbox.app.bind(Container.Identifiers.PeerRepository).toConstantValue(peerRepository);
        sandbox.app.bind(Container.Identifiers.DatabaseService).toConstantValue(database);
        sandbox.app.bind(Container.Identifiers.DatabaseInterceptor).toConstantValue(databaseInterceptor);
        sandbox.app.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);

        sandbox.app.version = jest.fn().mockReturnValue("3.0.9");

        peerController = sandbox.app.resolve<PeerController>(PeerController);
    });

    describe("getPeers", () => {
        it("should return the peers except connected peer sorted by latency", () => {
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
            peerRepository.getPeers = jest.fn().mockReturnValueOnce(peers);

            const request = {
                socket: {
                    info: { remoteAddress: "180.177.54.4" },
                },
            };
            const peersBroadcast = peerController.getPeers(request, {});

            expect(peersBroadcast).toEqual([peers[2], peers[1], peers[3], peers[4]].map((p) => p.toBroadcast()));
        });

        it("should return the peers except forwarded peer sorted by latency", () => {
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
            peerRepository.getPeers = jest.fn().mockReturnValueOnce(peers);

            const request = {
                socket: {
                    info: { remoteAddress: "1.2.3.4", "x-forwarded-for": "180.177.54.4" },
                },
            };
            const peersBroadcast = peerController.getPeers(request, {});

            expect(peersBroadcast).toEqual([peers[2], peers[1], peers[3], peers[4]].map((p) => p.toBroadcast()));
        });
    });

    describe("getCommonBlocks", () => {
        it("should return the last common block found and the last height", async () => {
            const request = { payload: { ids: ["123456789", "111116789"] } };
            databaseInterceptor.getCommonBlocks = jest.fn().mockReturnValueOnce(request.payload.ids);
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
            databaseInterceptor.getCommonBlocks = jest.fn().mockReturnValueOnce([]);

            await expect(peerController.getCommonBlocks(request, {})).rejects.toBeInstanceOf(MissingCommonBlockError);
        });
    });

    describe("getStatus", () => {
        beforeEach(() => {
            // @ts-ignore
            getPeerConfig = jest.fn().mockReturnValue({});
        });

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

            expect(getPeerConfig).toHaveBeenCalledTimes(1);
            expect(status).toEqual({
                state: {
                    height,
                    forgingAllowed: slotInfo.forgingStatus,
                    currentSlot: slotInfo.slotNumber,
                    header,
                },
                config: getPeerConfig({} as any),
            });
        });
    });
});
