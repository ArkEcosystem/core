import { DownloadBlocks } from "@packages/core-blockchain/src/state-machine/actions/download-blocks";
import { Container, Utils } from "@packages/core-kernel";
import delay from "delay";

describe("DownloadBlocks", () => {
    let container: Container.Container;
    let blockchain;
    let lastBlock;
    let stateStore;
    let logger;
    let peerNetworkMonitor;
    let application;

    beforeEach(() => {
        jest.resetAllMocks();

        blockchain = {
            isStopped: jest.fn().mockReturnValue(false),
            dispatch: jest.fn(),
            getQueue: jest.fn().mockReturnValue({ size: jest.fn().mockReturnValue(0) }),
            clearQueue: jest.fn(),
            enqueueBlocks: jest.fn(),
        };
        lastBlock = { data: { id: "1234", height: 3333, timestamp: 11111 } };
        stateStore = {
            getLastBlock: () => lastBlock,
            getLastDownloadedBlock: jest.fn(),
            setLastDownloadedBlock: jest.fn(),
            getNoBlockCounter: jest.fn().mockReturnValue(0),
            setNoBlockCounter: jest.fn(),
        };
        logger = { warning: jest.fn(), debug: jest.fn(), info: jest.fn(), error: jest.fn() };
        peerNetworkMonitor = { downloadBlocksFromHeight: jest.fn() };

        application = {};

        container = new Container.Container();
        container.bind(Container.Identifiers.Application).toConstantValue(application);
        container.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);
        container.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.PeerNetworkMonitor).toConstantValue(peerNetworkMonitor);

        const getTimeStampForBlock = (height: number) => {
            switch (height) {
                case 1:
                    return 0;
                default:
                    throw new Error(`Test scenarios should not hit this line`);
            }
        };

        const spyblockTimeLookup = jest.spyOn(Utils.forgingInfoCalculator, "getBlockTimeLookup");

        spyblockTimeLookup.mockResolvedValue(getTimeStampForBlock);
    });
    describe("handle", () => {
        it("should do nothing when blockchain.isStopped", async () => {
            const downloadBlocks = container.resolve<DownloadBlocks>(DownloadBlocks);

            blockchain.isStopped = jest.fn().mockReturnValue(true);
            await downloadBlocks.handle();

            expect(blockchain.dispatch).toHaveBeenCalledTimes(0);
        });

        it("should do nothing when stateStore.getLastDownloadedBlock !== lastDownloadedBlock", async () => {
            const downloadBlocks = container.resolve<DownloadBlocks>(DownloadBlocks);

            peerNetworkMonitor.downloadBlocksFromHeight = jest.fn().mockImplementationOnce(async () => {
                await delay(1000);
                return [];
            });
            const handlePromise = downloadBlocks.handle();
            stateStore.getLastDownloadedBlock = jest
                .fn()
                .mockReturnValue({ data: { id: "987", height: 233, timestamp: 111 } });
            await handlePromise;

            expect(blockchain.dispatch).toHaveBeenCalledTimes(0);
        });

        it("should dispatch NOBLOCK when downloadBlocksFromHeight returns no block", async () => {
            const downloadBlocks = container.resolve<DownloadBlocks>(DownloadBlocks);

            peerNetworkMonitor.downloadBlocksFromHeight = jest.fn().mockReturnValue([]);
            await downloadBlocks.handle();

            expect(blockchain.dispatch).toHaveBeenCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenLastCalledWith("NOBLOCK");
            expect(stateStore.setNoBlockCounter).toHaveBeenLastCalledWith(1);
        });

        it("should dispatch NOBLOCK when downloadBlocksFromHeight returns no chained block", async () => {
            const downloadBlocks = container.resolve<DownloadBlocks>(DownloadBlocks);

            peerNetworkMonitor.downloadBlocksFromHeight = jest.fn().mockReturnValue([{ height: 11 }]);
            await downloadBlocks.handle();

            expect(blockchain.dispatch).toHaveBeenCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenLastCalledWith("NOBLOCK");
            expect(stateStore.setNoBlockCounter).toHaveBeenLastCalledWith(1);
        });

        it("should enqueueBlocks and dispatch DOWNLOADED when downloadBlocksFromHeight returns chained blocks", async () => {
            const downloadBlocks = container.resolve<DownloadBlocks>(DownloadBlocks);

            peerNetworkMonitor.downloadBlocksFromHeight = jest.fn().mockReturnValue([
                {
                    height: lastBlock.data.height + 1,
                    previousBlock: lastBlock.data.id,
                    timestamp: lastBlock.data.timestamp + 20,
                },
            ]);
            await downloadBlocks.handle();

            expect(blockchain.enqueueBlocks).toHaveBeenCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenLastCalledWith("DOWNLOADED");
        });

        it("should dispatch NOBLOCK when enqueueBlocks throws exception", async () => {
            const downloadBlocks = container.resolve<DownloadBlocks>(DownloadBlocks);

            peerNetworkMonitor.downloadBlocksFromHeight = jest.fn().mockReturnValue([
                {
                    height: lastBlock.data.height + 1,
                    previousBlock: lastBlock.data.id,
                    timestamp: lastBlock.data.timestamp + 20,
                },
            ]);
            blockchain.enqueueBlocks = jest.fn().mockImplementationOnce(() => {
                throw new Error("oops");
            });
            await downloadBlocks.handle();

            expect(blockchain.dispatch).toHaveBeenCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenLastCalledWith("NOBLOCK");
        });
    });
});
