import { ProcessBlockAction } from "@arkecosystem/core-blockchain/src/actions";
import { Container, Services } from "@arkecosystem/core-kernel";
import { Crypto, Interfaces, Networks } from "@arkecosystem/crypto";
import { ProcessBlocksJob } from "@packages/core-blockchain/src/process-blocks-job";
import { BlockProcessorResult } from "@packages/core-blockchain/src/processor";
import { Sandbox } from "@packages/core-test-framework";

import { Blocks } from "./__fixtures__";

describe("Blockchain", () => {
    let sandbox: Sandbox;
    let processBlocksJob: ProcessBlocksJob;

    const blockchainService: any = {};
    const blockProcessor: any = {};
    const stateStore: any = {};
    const databaseService: any = {};
    const databaseBlockRepository: any = {};
    const databaseInteraction: any = {};
    const peerNetworkMonitor: any = {};
    const logService: any = {
        debug: jest.fn(),
        warning: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
    };

    beforeAll(() => {
        sandbox = new Sandbox();

        sandbox.app.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchainService);
        sandbox.app.bind(Container.Identifiers.BlockProcessor).toConstantValue(blockProcessor);
        sandbox.app.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
        sandbox.app.bind(Container.Identifiers.DatabaseService).toConstantValue(databaseService);
        sandbox.app.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue(databaseBlockRepository);
        sandbox.app.bind(Container.Identifiers.DatabaseInteraction).toConstantValue(databaseInteraction);
        sandbox.app.bind(Container.Identifiers.PeerNetworkMonitor).toConstantValue(peerNetworkMonitor);
        sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logService);

        sandbox.app.bind(Container.Identifiers.TriggerService).to(Services.Triggers.Triggers).inSingletonScope();
        sandbox.app
            .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
            .bind("processBlock", new ProcessBlockAction());
    });

    beforeEach(() => {
        processBlocksJob = sandbox.app.resolve(ProcessBlocksJob);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("blocks", () => {
        it("should set and get blocks", async () => {
            // @ts-ignore
            const blocks = [
                { ...Blocks.block2.data, transactions: [] },
                { ...Blocks.block3.data, transactions: [] },
            ] as Interfaces.IBlockData[];

            processBlocksJob.setBlocks(blocks);

            expect(processBlocksJob.getBlocks()).toEqual(blocks);
        });
    });

    describe("processBlocks", () => {
        // @ts-ignore
        const lastBlock: Interfaces.IBlockData = { ...Blocks.block2.data, transactions: [] };
        // @ts-ignore
        const currentBlock: Interfaces.IBlockData = { ...Blocks.block3.data, transactions: [] };

        it("should skip processing if blocks are not set", async () => {
            await processBlocksJob.handle();
        });

        it("should process a new chained block", async () => {
            blockchainService.getLastBlock = jest.fn().mockReturnValue({ data: lastBlock }); // TODO: Use stateStore
            blockProcessor.process = jest.fn().mockReturnValue(BlockProcessorResult.Accepted);
            blockProcessor.validateGenerator = jest.fn().mockReturnValue(BlockProcessorResult.Accepted);

            stateStore.setLastBlock = jest.fn();
            databaseBlockRepository.saveBlocks = jest.fn();

            processBlocksJob.setBlocks([currentBlock]);
            await processBlocksJob.handle();

            expect(stateStore.setLastBlock).toHaveBeenCalledTimes(1);
            expect(databaseBlockRepository.saveBlocks).toHaveBeenCalledTimes(1);
        });

        it("should process a valid block already known", async () => {
            blockchainService.getLastBlock = jest.fn().mockReturnValue({ data: lastBlock });
            blockchainService.clearQueue = jest.fn();
            blockchainService.resetLastDownloadedBlock = jest.fn();

            processBlocksJob.setBlocks([lastBlock]);
            await processBlocksJob.handle();

            expect(blockchainService.clearQueue).toBeCalledTimes(1);
            expect(blockchainService.resetLastDownloadedBlock).toBeCalledTimes(1);
        });

        it("should not process the remaining blocks if one is not accepted (BlockProcessorResult.Rollback)", async () => {
            const genesisBlock = Networks.testnet.genesisBlock;
            blockchainService.getLastBlock = jest.fn().mockReturnValue({ data: genesisBlock });
            blockProcessor.process = jest.fn().mockReturnValue(BlockProcessorResult.Rollback);
            blockchainService.forkBlock = jest.fn();

            processBlocksJob.setBlocks([lastBlock, currentBlock]);
            await processBlocksJob.handle();

            expect(blockProcessor.process).toBeCalledTimes(1); // only 1 out of the 2 blocks
            expect(blockchainService.forkBlock).toBeCalledTimes(1); // because Rollback
        });

        it("should not process the remaining blocks if one is not accepted (BlockProcessorResult.Rejected)", async () => {
            const genesisBlock = Networks.testnet.genesisBlock;
            blockchainService.getLastBlock = jest.fn().mockReturnValue({ data: genesisBlock });
            blockProcessor.process = jest.fn().mockReturnValue(BlockProcessorResult.Rejected);
            stateStore.getLastBlock = jest.fn().mockReturnValue({ data: genesisBlock });
            databaseService.getLastBlock = jest.fn().mockReturnValue({ data: genesisBlock });

            blockchainService.clearQueue = jest.fn();
            databaseInteraction.loadBlocksFromCurrentRound = jest.fn();
            blockchainService.resetLastDownloadedBlock = jest.fn();

            processBlocksJob.setBlocks([lastBlock, currentBlock]);
            await processBlocksJob.handle();

            expect(blockProcessor.process).toBeCalledTimes(1);
            expect(blockchainService.clearQueue).toBeCalledTimes(1);
            expect(blockchainService.resetLastDownloadedBlock).toBeCalledTimes(1);
        });


        // TODO Finish
        // it("should not process the remaining blocks if second is not accepted (BlockProcessorResult.Rejected)", async () => {
        //     const genesisBlock = Networks.testnet.genesisBlock;
        //     blockchainService.getLastBlock = jest
        //         .fn()
        //         .mockReturnValueOnce({ data: genesisBlock })
        //         .mockReturnValueOnce({ data: genesisBlock })
        //         .mockReturnValueOnce(Blocks.block2);
        //     blockProcessor.process = jest
        //         .fn()
        //         .mockReturnValueOnce(BlockProcessorResult.Accepted)
        //         .mockReturnValueOnce(BlockProcessorResult.Rejected);
        //     stateStore.getLastBlock = jest.fn().mockReturnValue({ data: genesisBlock });
        //     databaseService.getLastBlock = jest.fn().mockReturnValue({ data: genesisBlock });
        //
        //     stateStore.setLastBlock = jest.fn();
        //     blockchainService.clearQueue = jest.fn();
        //     databaseInteraction.loadBlocksFromCurrentRound = jest.fn();
        //     blockchainService.resetLastDownloadedBlock = jest.fn();
        //     databaseBlockRepository.saveBlocks = jest.fn();
        //
        //     processBlocksJob.setBlocks([lastBlock, currentBlock]);
        //     await processBlocksJob.handle();
        //
        //     expect(blockProcessor.process).toBeCalledTimes(1);
        //     expect(stateStore.setLastBlock).toBeCalledTimes(1);
        //     expect(databaseBlockRepository.saveBlocks).toBeCalledTimes(1);
        //     expect(blockchainService.clearQueue).toBeCalledTimes(1);
        //     expect(blockchainService.resetLastDownloadedBlock).toBeCalledTimes(1);
        // });

        it("should revert block when blockRepository saveBlocks fails", async () => {
            blockchainService.getLastBlock = jest.fn().mockReturnValue({ data: lastBlock });
            databaseService.getLastBlock = jest.fn().mockReturnValue({ data: lastBlock });
            blockProcessor.process = jest.fn().mockReturnValue(BlockProcessorResult.Accepted);
            databaseBlockRepository.saveBlocks = jest.fn().mockRejectedValue(new Error("oops"));

            blockchainService.clearQueue = jest.fn();
            blockchainService.resetLastDownloadedBlock = jest.fn();
            databaseInteraction.revertBlock = jest.fn();
            databaseInteraction.loadBlocksFromCurrentRound = jest.fn();
            databaseService.deleteRound = jest.fn();

            stateStore.setLastBlock = jest.fn();

            processBlocksJob.setBlocks([currentBlock]);
            await processBlocksJob.handle();

            expect(blockchainService.clearQueue).toBeCalledTimes(1);
            expect(blockchainService.resetLastDownloadedBlock).toBeCalledTimes(1);
            expect(databaseInteraction.revertBlock).toBeCalledTimes(1);
            expect(databaseInteraction.loadBlocksFromCurrentRound).toBeCalledTimes(1);
            expect(databaseService.deleteRound).toBeCalledTimes(1);

            expect(stateStore.setLastBlock).toHaveBeenCalledTimes(2); // Set and revert
        });

        it("should broadcast a block if (Crypto.Slots.getSlotNumber() * blocktime <= block.data.timestamp)", async () => {
            const getTimeStampForBlock = (height: number) => {
                switch (height) {
                    case 1:
                        return 0;
                    default:
                        throw new Error(`Test scenarios should not hit this line`);
                }
            };

            let slotInfo = Crypto.Slots.getSlotInfo(getTimeStampForBlock);

            // Wait until we get a timestamp at the first half of a slot (allows for computation time)
            while (!slotInfo.forgingStatus) {
                slotInfo = Crypto.Slots.getSlotInfo(getTimeStampForBlock);
            }

            const block = {
                ...currentBlock,
                timestamp: slotInfo.startTime,
            };

            stateStore.started = true;
            blockchainService.getLastBlock = jest.fn().mockReturnValue({ data: lastBlock });
            databaseService.getLastBlock = jest.fn().mockReturnValue({ data: lastBlock });
            blockProcessor.process = jest.fn().mockReturnValue(BlockProcessorResult.Accepted);

            stateStore.setLastBlock = jest.fn();
            databaseBlockRepository.saveBlocks = jest.fn();
            peerNetworkMonitor.broadcastBlock = jest.fn();

            processBlocksJob.setBlocks([block]);
            await processBlocksJob.handle();

            expect(stateStore.setLastBlock).toBeCalledTimes(1);
            expect(databaseBlockRepository.saveBlocks).toBeCalledTimes(1);

            expect(peerNetworkMonitor.broadcastBlock).toBeCalledTimes(1);
        });
    });
});
