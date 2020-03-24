import "jest-extended";
import delay from "delay";

import { Container, Enums } from "@arkecosystem/core-kernel";
import { Blockchain } from "../../../packages/core-blockchain/src/blockchain";
import { BlockProcessorResult } from "../../../packages/core-blockchain/src/processor/block-processor";
import { Interfaces, Crypto, Utils, Blocks, Managers, Networks } from "@arkecosystem/crypto";

describe("Blockchain", () => {
    const container = new Container.Container();

    const logService: any = {};
    const stateStore: any = {};
    const databaseService: any = {};
    const blockRepository: any = {};
    const transactionPoolService: any = {};
    const stateMachine: any = {};
    const eventDispatcherService: any = {};
    const peerNetworkMonitor: any = {};
    const peerStorage: any = {};
    const blockProcessor: any = {};

    const applicationGet = {
        [Container.Identifiers.PeerNetworkMonitor]: peerNetworkMonitor,
        [Container.Identifiers.PeerStorage]: peerStorage,
        [Container.Identifiers.StateStore]: stateStore,
    };

    const application = {
        log: logService,
        resolve: () => blockProcessor,
        get: id => applicationGet[id],
        events: eventDispatcherService
    };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.Application).toConstantValue(application);
        container.bind(Container.Identifiers.LogService).toConstantValue(logService);
        container.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
        container.bind(Container.Identifiers.DatabaseService).toConstantValue(databaseService);
        container.bind(Container.Identifiers.BlockRepository).toConstantValue(blockRepository);
        container.bind(Container.Identifiers.TransactionPoolService).toConstantValue(transactionPoolService);
        container.bind(Container.Identifiers.StateMachine).toConstantValue(stateMachine);
        container.bind(Container.Identifiers.EventDispatcherService).toConstantValue(eventDispatcherService);

        Managers.configManager.setFromPreset("testnet");
    });

    beforeEach(() => {
        jest.restoreAllMocks();

        logService.warning = jest.fn();
        logService.info = jest.fn();
        logService.error = jest.fn();

        stateStore.started = false;
        stateStore.clearWakeUpTimeout = jest.fn();
        stateStore.wakeUpTimeout = undefined;
        stateStore.lastDownloadedBlock = undefined;
        stateStore.blockPing = undefined;
        stateStore.getGenesisBlock = jest.fn().mockReturnValue(Networks.testnet.genesisBlock);
        stateStore.getLastBlock = jest.fn();
        stateStore.setLastBlock = jest.fn();
        stateStore.pushPingBlock = jest.fn();
        stateStore.pingBlock = jest.fn();
            
        databaseService.getTopBlocks = jest.fn();
        databaseService.getLastBlock = jest.fn();
        databaseService.loadBlocksFromCurrentRound = jest.fn();
        databaseService.revertBlock = jest.fn();
        databaseService.deleteRound = jest.fn();
        
        blockRepository.deleteBlocks = jest.fn();
        blockRepository.saveBlocks = jest.fn();
        
        stateMachine.transition = jest.fn();

        eventDispatcherService.listen = jest.fn();
        eventDispatcherService.dispatch = jest.fn();
        
        peerNetworkMonitor.cleansePeers = jest.fn();
        peerNetworkMonitor.updateNetworkStatus = jest.fn();
        peerNetworkMonitor.broadcastBlock = jest.fn();
        peerNetworkMonitor.checkNetworkHealth = jest.fn();
        
        peerStorage.hasPeers = jest.fn();

        blockProcessor.process = jest.fn();

        transactionPoolService.readdTransactions = jest.fn();
    })

    describe("initialize", () => {
        it ("should log a warning if networkStart option is provided", () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);

            blockchain.initialize({});
            expect(logService.warning).toBeCalledTimes(0);

            blockchain.initialize({ networkStart: false });
            expect(logService.warning).toBeCalledTimes(0);

            blockchain.initialize({ networkStart: true });
            expect(logService.warning).toBeCalledTimes(1);
        });
    });

    describe("dispatch", () => {
        it("should call transition method on stateMachine with the event provided", () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            const eventToDispatch = "any.event.to.dispatch";

            expect(stateMachine.transition).toBeCalledTimes(0);
            blockchain.dispatch(eventToDispatch);
            expect(stateMachine.transition).toBeCalledTimes(1);
            expect(stateMachine.transition).toHaveBeenLastCalledWith(eventToDispatch);
        });
    });

    describe("boot", () => {
        it("should dispatch 'START'", async () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            const spyDispatch = jest.spyOn(blockchain, "dispatch");
            
            stateStore.started = true;
            await blockchain.boot();

            expect(spyDispatch).toBeCalledTimes(1);
            expect(spyDispatch).toHaveBeenLastCalledWith("START");
        });

        it("should dispatch START and return true even if stateStore is not ready when skipStartedCheck === true", async () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            const spyDispatch = jest.spyOn(blockchain, "dispatch");
            
            stateStore.started = false;
            const bootResult = await blockchain.boot(true);

            expect(bootResult).toBeTrue();
            expect(spyDispatch).toBeCalledTimes(1);
            expect(spyDispatch).toHaveBeenLastCalledWith("START");

            // should be the same with process.env.CORE_SKIP_BLOCKCHAIN_STARTED_CHECK
            jest.resetAllMocks();
            stateStore.started = false;
            process.env.CORE_SKIP_BLOCKCHAIN_STARTED_CHECK = "true";
            const bootResultEnv = await blockchain.boot();

            expect(bootResultEnv).toBeTrue();
            expect(spyDispatch).toBeCalledTimes(1);
            expect(spyDispatch).toHaveBeenLastCalledWith("START");

            delete process.env.CORE_SKIP_BLOCKCHAIN_STARTED_CHECK;
        });

        it("should wait for stateStore to be started before resolving", async () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            
            stateStore.started = false;
            const resolved = jest.fn();
            const checkBootResolved = async () =>  {
                await blockchain.boot();
                resolved();
            }
            checkBootResolved();

            // will not resolve after 2 seconds while stateStore.started is false
            await delay(2000);
            expect(resolved).toBeCalledTimes(0);

            // will resolve after 1 second when stateStore.started is true
            stateStore.started = true;
            await delay(1100);

            expect(resolved).toBeCalledTimes(1);
        });

        it("should call cleansePeers and set listener on ForgerEvent.Missing and RoundEvent.Applied", async () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            stateStore.started = true;

            expect(peerNetworkMonitor.cleansePeers).toBeCalledTimes(0);

            await blockchain.boot();

            expect(peerNetworkMonitor.cleansePeers).toBeCalledTimes(1);
            expect(eventDispatcherService.listen).toHaveBeenCalledTimes(2);
            expect(eventDispatcherService.listen).toHaveBeenNthCalledWith(1, Enums.ForgerEvent.Missing, { handle: expect.any(Function) });
            expect(eventDispatcherService.listen).toHaveBeenNthCalledWith(2, Enums.RoundEvent.Applied, { handle: expect.any(Function) });
        });
    });

    describe("dispose", () => {
        it("should call clearWakeUpTimeout on stateStore and dispatch 'STOP'", async () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            blockchain.initialize({});

            const spyDispatch = jest.spyOn(blockchain, "dispatch");

            await blockchain.dispose();

            expect(stateStore.clearWakeUpTimeout).toBeCalledTimes(1)
            expect(spyDispatch).toBeCalledTimes(1);
            expect(spyDispatch).toHaveBeenLastCalledWith("STOP");
        })
    });

    describe("setWakeUp", () => {
        it("should set wakeUpTimeout on stateStore", () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);

            expect(stateStore.wakeUpTimeout).toBeUndefined();

            blockchain.setWakeUp();
            expect(stateStore.wakeUpTimeout).toBeDefined();
        })

        it("should dispatch WAKEUP when wake up function is called", () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            jest.useFakeTimers();
            const spyDispatch = jest.spyOn(blockchain, "dispatch");

            blockchain.setWakeUp();
            expect(spyDispatch).toBeCalledTimes(0);

            jest.runAllTimers();

            expect(spyDispatch).toBeCalledTimes(1);
            expect(spyDispatch).toBeCalledWith("WAKEUP");

            jest.useRealTimers();
        })
    });

    describe("resetWakeUp", () => {
        it("should call stateStore clearWakeUpTimeout and own setWakeUp method", () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            const spySetWakeUp = jest.spyOn(blockchain, "setWakeUp");

            blockchain.resetWakeUp();

            expect(stateStore.clearWakeUpTimeout).toBeCalledTimes(1);
            expect(spySetWakeUp).toBeCalledTimes(1);
        })
    });

    describe("updateNetworkStatus", () => {
        it("should call updateNetworkStatus on peerNetworkMonitor", () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);

            blockchain.updateNetworkStatus();

            expect(peerNetworkMonitor.updateNetworkStatus).toBeCalledTimes(1);
        })
    });

    describe("clearAndStopQueue", () => {
        it("should set state.lastDownloadedBlock from this.getLastBlock() and clear queue", () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            blockchain.initialize({});

            const spyClearQueue = jest.spyOn(blockchain, "clearQueue");
            stateStore.lastDownloadedBlock = undefined;
            const mockLastBlock = { data: { id: "abcd1234" } };
            stateStore.getLastBlock = jest.fn().mockImplementation(() => mockLastBlock);

            blockchain.clearAndStopQueue();

            expect(stateStore.lastDownloadedBlock).toEqual(mockLastBlock.data);
            expect(spyClearQueue).toBeCalledTimes(1);
        })
    });

    describe("clearQueue", () => {
        it("should call queue.remove", () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            blockchain.initialize({});

            const spyQueueRemove = jest.spyOn(blockchain.queue, "remove");

            blockchain.clearQueue();

            expect(spyQueueRemove).toBeCalledTimes(1);
        })
    });

    describe("handleIncomingBlock", () => {
        const blockData = { height: 30122 } as Interfaces.IBlockData;

        beforeEach(() => {
            jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValue(1);
        });

        describe("when state is started", () => {
            it("should dispatch 'NEWBLOCK', BlockEvent.Received and enqueue the block", () => {
                const blockchain = container.resolve<Blockchain>(Blockchain);
                blockchain.initialize({});
                const spyDispatch = jest.spyOn(blockchain, "dispatch");
                const spyEnqueue = jest.spyOn(blockchain, "enqueueBlocks");
                stateStore.started = true;
                stateStore.getLastBlock = jest.fn().mockReturnValue({ data: blockData });

                blockchain.handleIncomingBlock(blockData);

                expect(spyDispatch).toBeCalledTimes(1);
                expect(spyDispatch).toHaveBeenLastCalledWith("NEWBLOCK");

                expect(eventDispatcherService.dispatch).toBeCalledTimes(1);
                expect(eventDispatcherService.dispatch).toHaveBeenLastCalledWith(Enums.BlockEvent.Received, blockData);

                expect(spyEnqueue).toBeCalledTimes(1);
                expect(spyEnqueue).toHaveBeenLastCalledWith([blockData]);
            })
        })

        describe("when state is not started", () => {
            it("should dispatch BlockEvent.Disregarded and not enqueue the block", () => {
                const blockchain = container.resolve<Blockchain>(Blockchain);
                const spyEnqueue = jest.spyOn(blockchain, "enqueueBlocks");
                stateStore.started = false;


                blockchain.handleIncomingBlock(blockData);

                expect(eventDispatcherService.dispatch).toBeCalledTimes(1);
                expect(eventDispatcherService.dispatch).toHaveBeenLastCalledWith(Enums.BlockEvent.Disregarded, blockData);

                expect(spyEnqueue).toBeCalledTimes(0);
            })
        })
        
        it("should not dispatch anything nor enqueue the block if receivedSlot > currentSlot", () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            const spyEnqueue = jest.spyOn(blockchain, "enqueueBlocks");

            jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValueOnce(1).mockReturnValueOnce(2);

            blockchain.handleIncomingBlock(blockData);

            expect(spyEnqueue).toBeCalledTimes(0);
            expect(eventDispatcherService.dispatch).toBeCalledTimes(0);
        })
    });

    describe("enqueueBlocks", () => {
        const blockData = { height: 30122, numberOfTransactions: 0 } as Interfaces.IBlockData;

        it("should just return if blocks provided are an empty array", async () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            blockchain.initialize({});
            const spyQueuePush = jest.spyOn(blockchain.queue, "push");

            blockchain.enqueueBlocks([]);
            expect(spyQueuePush).not.toHaveBeenCalled();
        });

        it("should enqueue the blocks", async () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            blockchain.initialize({});
            stateStore.lastDownloadedBlock = { height: 23111 };
            
            const spyQueuePush = jest.spyOn(blockchain.queue, "push");

            blockchain.enqueueBlocks([blockData]);

            expect(spyQueuePush).toHaveBeenCalledWith({ blocks: [blockData] });
        });

        it("should push a chunk to the queue when currentTransactionsCount >= 150", async () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            blockchain.initialize({});
            stateStore.lastDownloadedBlock = { height: 23111 };
            
            const spyQueuePush = jest.spyOn(blockchain.queue, "push");

            const blockWith150Txs = { height: blockData.height + 1, numberOfTransactions: 150} as Interfaces.IBlockData;

            blockchain.enqueueBlocks([
                blockWith150Txs,
                blockData,
            ]);

            expect(spyQueuePush).toHaveBeenCalledTimes(2);
            expect(spyQueuePush).toHaveBeenCalledWith({ blocks: [blockWith150Txs] });
            expect(spyQueuePush).toHaveBeenCalledWith({ blocks: [blockData] });
        });

        it("should push a chunk to the queue when currentBlocksChunk.length > 100", async () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            blockchain.initialize({});
            stateStore.lastDownloadedBlock = { height: 23111 };
            
            const spyQueuePush = jest.spyOn(blockchain.queue, "push");

            const blocksToEnqueue = [];
            for (let i = 0; i <= 101; i++) {
                blocksToEnqueue.push(blockData);
            }
            blockchain.enqueueBlocks(blocksToEnqueue);

            expect(spyQueuePush).toHaveBeenCalledTimes(2);
            expect(spyQueuePush).toHaveBeenCalledWith({ blocks: blocksToEnqueue.slice(-1) });
            expect(spyQueuePush).toHaveBeenCalledWith({ blocks: [blockData] });
        });

        it("should push a chunk to the queue when hitting new milestone", async () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            blockchain.initialize({});
            stateStore.lastDownloadedBlock = { height: 7555 };
            
            const spyQueuePush = jest.spyOn(blockchain.queue, "push");

            const blockMilestone = { id: "123", height: 75600 } as Interfaces.IBlockData;
            const blockAfterMilestone = { id: "456", height: 75601 } as Interfaces.IBlockData;
            blockchain.enqueueBlocks([ blockMilestone, blockAfterMilestone ]);

            expect(spyQueuePush).toHaveBeenCalledTimes(2);
            expect(spyQueuePush).toHaveBeenCalledWith({ blocks: [ blockMilestone ] });
            expect(spyQueuePush).toHaveBeenCalledWith({ blocks: [ blockAfterMilestone ] });
        });
    });

    const blockHeight2 = {
        data: {
            id: "17882607875259085966",
            version: 0,
            timestamp: 46583330,
            height: 2,
            reward: Utils.BigNumber.make("0"),
            previousBlock: "17184958558311101492",
            numberOfTransactions: 0,
            totalAmount: Utils.BigNumber.make("0"),
            totalFee: Utils.BigNumber.make("0"),
            payloadLength: 0,
            payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            generatorPublicKey: "026c598170201caf0357f202ff14f365a3b09322071e347873869f58d776bfc565",
            blockSignature:
                "3045022100e7385c6ea42bd950f7f6ab8c8619cf2f66a41d8f8f185b0bc99af032cb25f30d02200b6210176a6cedfdcbe483167fd91c21d740e0e4011d24d679c601fdd46b0de9",
            createdAt: "2018-09-11T16:48:50.550Z",
        },
        transactions: []
    };
    const blockHeight3 = {
        data: {
            id: "7242383292164246617",
            version: 0,
            timestamp: 46583338,
            height: 3,
            reward: Utils.BigNumber.make("0"),
            previousBlock: "17882607875259085966",
            numberOfTransactions: 0,
            totalAmount: Utils.BigNumber.make("0"),
            totalFee: Utils.BigNumber.make("0"),
            payloadLength: 0,
            payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            generatorPublicKey: "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17",
            blockSignature:
                "304402204087bb1d2c82b9178b02b9b3f285de260cdf0778643064fe6c7aef27321d49520220594c57009c1fca543350126d277c6adeb674c00685a464c3e4bf0d634dc37e39",
            createdAt: "2018-09-11T16:48:58.431Z",
        },
        transactions: []
    };
    describe("removeBlocks", () => {
        it("should call revertBlock and setLastBlock for each block to be removed, and deleteBlocks with all blocks removed", async () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            blockchain.initialize({});
            
            const blocksToRemove = [ blockHeight2, blockHeight3 ];
            stateStore.getLastBlock = jest.fn()
                .mockReturnValueOnce(blocksToRemove[1]) // called in clearAndStopQueue
                .mockReturnValueOnce(blocksToRemove[1]) // called in removeBlocks
                .mockReturnValueOnce(blocksToRemove[1]) // called in __removeBlocks
                .mockReturnValueOnce(blocksToRemove[1]) // called in revertLastBlock
                .mockReturnValueOnce(blocksToRemove[0]) // called in __removeBlocks
                .mockReturnValueOnce(blocksToRemove[0]) // called in revertLastBlock
            databaseService.getBlocks = jest.fn().mockReturnValueOnce(
                blocksToRemove.map(b => ({ ...b.data, transactions: b.transactions}))
            );

            await blockchain.removeBlocks(2);

            expect(databaseService.revertBlock).toHaveBeenCalledTimes(2);
            expect(stateStore.setLastBlock).toHaveBeenCalledTimes(2);
            expect(blockRepository.deleteBlocks).toHaveBeenCalledTimes(1);
        });

        it("should default to removing until genesis block when asked to remove more", async () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            blockchain.initialize({});
            
            const genesisBlock = Networks.testnet.genesisBlock;
            stateStore.getLastBlock = jest.fn()
                .mockReturnValueOnce(blockHeight2) // called in clearAndStopQueue
                .mockReturnValueOnce(blockHeight2) // called in removeBlocks
                .mockReturnValueOnce(blockHeight2) // called in __removeBlocks
                .mockReturnValueOnce(blockHeight2) // called in revertLastBlock
                .mockReturnValue(genesisBlock);
            databaseService.getBlocks = jest.fn().mockReturnValueOnce([
                { ...blockHeight2.data, transactions: blockHeight2.transactions },
                genesisBlock
            ]);

            await blockchain.removeBlocks(blockHeight2.data.height + 10);

            stateStore.getLastBlock = jest.fn();

            expect(databaseService.revertBlock).toHaveBeenCalledTimes(1);
            expect(stateStore.setLastBlock).toHaveBeenCalledTimes(1);
            expect(blockRepository.deleteBlocks).toHaveBeenCalledTimes(1);
        });
    });

    describe("removeTopBlocks", () => {
        it.each([[1], [5], [1329]])(
            "should get the top %i blocks from database and delete them with blockRepository",
            async (numberOfBlocks) => {
                const blockchain = container.resolve<Blockchain>(Blockchain);

                const mockTopBlocks = [];
                for (let i = 0; i < numberOfBlocks; i++) {
                    mockTopBlocks.push({ height: 1000 + i })
                }
                databaseService.getTopBlocks.mockReturnValueOnce(mockTopBlocks);

                await blockchain.removeTopBlocks(numberOfBlocks);

                expect(databaseService.getTopBlocks).toHaveBeenLastCalledWith(numberOfBlocks);
                expect(blockRepository.deleteBlocks).toHaveBeenLastCalledWith(mockTopBlocks);
                expect(databaseService.loadBlocksFromCurrentRound).toHaveBeenCalled();
        });

        it("should log an error if deleteBlocks throws", async () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            blockRepository.deleteBlocks.mockRejectedValueOnce(new Error("error deleteBlocks"));
            databaseService.getTopBlocks.mockReturnValueOnce([ { height: 48990 }]);

            await blockchain.removeTopBlocks(1);

            expect(logService.error).toBeCalledTimes(1);
        })
    });

    describe("processBlocks", () => {
        const lastBlock = { ...blockHeight2.data, transactions: [] };
        const currentBlock = { ...blockHeight3.data, transactions: [] };
        
        it("should process a new chained block", async () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            blockchain.initialize({});

            stateStore.getLastBlock = jest.fn().mockReturnValue({ data: lastBlock });
            blockProcessor.process = jest.fn().mockReturnValue(BlockProcessorResult.Accepted);
            const callback = jest.fn();

            await blockchain.processBlocks([ currentBlock ], callback);

            expect(callback).toBeCalledTimes(1);
            expect(callback).toHaveBeenLastCalledWith([ expect.any(Blocks.Block) ]);
            // callback is called with acceptedBlocks, here our currentBlock
        });

        it("should process a valid block already known", async () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            blockchain.initialize({});

            stateStore.getLastBlock = jest.fn().mockReturnValue({ data: lastBlock });
            const callback = jest.fn();
            const spyClearQueue = jest.spyOn(blockchain, "clearQueue");
            const spyResetLastDownloadedBlock = jest.spyOn(blockchain, "resetLastDownloadedBlock");
            
            await blockchain.processBlocks([ lastBlock ], callback);

            expect(callback).toBeCalledTimes(1);
            expect(callback).toHaveBeenLastCalledWith();
            expect(spyClearQueue).toBeCalledTimes(1);
            expect(spyResetLastDownloadedBlock).toBeCalledTimes(1);
        });

        it("should not process the remaining block if one is not accepted", async () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            blockchain.initialize({});

            const genesisBlock = Networks.testnet.genesisBlock;
            stateStore.getLastBlock = jest.fn().mockReturnValue({ data: genesisBlock });
            blockProcessor.process = jest.fn().mockReturnValue(BlockProcessorResult.Rollback);
            const callback = jest.fn();
            const spyForkBlock = jest.spyOn(blockchain, "forkBlock");

            await blockchain.processBlocks([ lastBlock, currentBlock ], callback);

            expect(callback).toBeCalledTimes(1);
            expect(callback).toHaveBeenLastCalledWith([]);
            expect(blockProcessor.process).toBeCalledTimes(1); // only 1 out of the 2 blocks
            expect(spyForkBlock).toBeCalledTimes(1); // because Rollback
        });

        it("should revert block when blockRepository saveBlocks fails", async () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            blockchain.initialize({});

            stateStore.getLastBlock = jest.fn().mockReturnValue({ data: lastBlock });
            databaseService.getLastBlock = jest.fn().mockReturnValue({ data: lastBlock });
            blockProcessor.process = jest.fn().mockReturnValue(BlockProcessorResult.Accepted);
            blockRepository.saveBlocks = jest.fn().mockRejectedValue(new Error("oops"));
            const callback = jest.fn();
            const spyClearQueue = jest.spyOn(blockchain, "clearQueue");
            const spyResetLastDownloadedBlock = jest.spyOn(blockchain, "resetLastDownloadedBlock");
            
            await blockchain.processBlocks([ currentBlock ], callback);

            expect(callback).toBeCalledTimes(1);
            expect(callback).toHaveBeenLastCalledWith();
            expect(spyClearQueue).toBeCalledTimes(1);
            expect(spyResetLastDownloadedBlock).toBeCalledTimes(1);
            expect(databaseService.revertBlock).toBeCalledTimes(1);
        });

        it("should broadcast a block if (Crypto.Slots.getSlotNumber() * blocktime <= block.data.timestamp)", async () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            blockchain.initialize({});
            const block = {
                ...currentBlock,
                timestamp: Crypto.Slots.getSlotNumber() * Managers.configManager.getMilestone(1).blocktime
            }

            stateStore.started = true;
            stateStore.getLastBlock = jest.fn().mockReturnValue({ data: lastBlock });
            databaseService.getLastBlock = jest.fn().mockReturnValue({ data: lastBlock });
            blockProcessor.process = jest.fn().mockReturnValue(BlockProcessorResult.Accepted);
            const callback = jest.fn();
            
            await blockchain.processBlocks([ block ], callback);

            expect(callback).toBeCalledTimes(1);
            expect(callback).toHaveBeenLastCalledWith([ expect.any(Blocks.Block) ]);
            expect(peerNetworkMonitor.broadcastBlock).toBeCalledTimes(1);
        });

        describe("calling processBlocks from the queue", () => {
            it("should call processBlocks from queue handler", async () => {
                const blockchain = container.resolve<Blockchain>(Blockchain);
                blockchain.initialize({});
                stateStore.getLastBlock = jest.fn().mockReturnValue({ data: lastBlock });
                blockProcessor.process = jest.fn().mockReturnValue(BlockProcessorResult.Accepted);
                stateStore.lastDownloadedBlock = { height: 23111 };
                
                const spyQueuePush = jest.spyOn(blockchain.queue, "push");
                const spyProcessBlocks = jest.spyOn(blockchain, "processBlocks");
    
                blockchain.enqueueBlocks([currentBlock]);
    
                expect(spyQueuePush).toHaveBeenCalledWith({ blocks: [currentBlock] });
                await delay(1000);
    
                expect(spyProcessBlocks).toBeCalledTimes(1);
            });

            it("should log an error when processBlocks throws for any reason", async () => {
                const blockchain = container.resolve<Blockchain>(Blockchain);
                blockchain.initialize({});
                stateStore.getLastBlock = jest.fn().mockImplementationOnce(() => {
                    throw new Error("oops")
                });
                blockProcessor.process = jest.fn().mockReturnValue(BlockProcessorResult.Accepted);
                stateStore.lastDownloadedBlock = { height: 23111 };
                
                const spyQueuePush = jest.spyOn(blockchain.queue, "push");
                const spyProcessBlocks = jest.spyOn(blockchain, "processBlocks");
    
                const blocksToEnqueue = [ currentBlock ];
                blockchain.enqueueBlocks(blocksToEnqueue);
    
                expect(spyQueuePush).toHaveBeenCalledWith({ blocks: blocksToEnqueue });
                await delay(1000);
    
                expect(spyProcessBlocks).toBeCalledTimes(1);
                expect(logService.error).toBeCalledWith(
                    `Failed to process ${blocksToEnqueue.length} blocks from height ${blocksToEnqueue[0].height} in queue.`
                );
            });
        })
    });

    describe("resetLastDownloadedBlock", () => {
        it("should set this.state.lastDownloadedBlock = this.getLastBlock().data", () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);

            stateStore.lastDownloadedBlock = undefined;
            const mockBlock = { data: { id: "123", height: 444 }};
            stateStore.getLastBlock = jest.fn().mockReturnValue(mockBlock);

            blockchain.resetLastDownloadedBlock();

            expect(stateStore.lastDownloadedBlock).toEqual(mockBlock.data);
        })
    });

    describe("forceWakeup", () => {
        it("should clearWakeUpTimeout and dispatch 'WAKEUP", () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            const spyDispatch = jest.spyOn(blockchain, "dispatch");

            blockchain.forceWakeup();

            expect(stateStore.clearWakeUpTimeout).toBeCalledTimes(1);
            expect(spyDispatch).toBeCalledTimes(1);
            expect(spyDispatch).toHaveBeenLastCalledWith("WAKEUP");
        })
    });

    describe("forkBlock", () => {
        it("should set forkedBlock, clear and stop queue and dispatch 'FORK'", () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            blockchain.initialize({});
            
            const forkedBlock = { data: { id:"1234", height: 8877 }};
            const numberOfBlocksToRollback = 34;
            const spyClearAndStopQueue = jest.spyOn(blockchain, "clearAndStopQueue");
            const spyDispatch = jest.spyOn(blockchain, "dispatch");
            const mockBlock = { data: { id: "123", height: 444 }};
            stateStore.getLastBlock = jest.fn().mockReturnValue(mockBlock);

            blockchain.forkBlock(forkedBlock as Interfaces.IBlock, numberOfBlocksToRollback);

            expect(stateStore.forkedBlock).toEqual(forkedBlock);
            expect(stateStore.numberOfBlocksToRollback).toEqual(numberOfBlocksToRollback);
            expect(spyClearAndStopQueue).toBeCalledTimes(1);
            expect(spyDispatch).toBeCalledTimes(1);
            expect(spyDispatch).toHaveBeenLastCalledWith("FORK");
        })
    });

    describe("isSynced", () => {
        it("should return true if we have no peer", () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);

            peerStorage.hasPeers = jest.fn().mockReturnValue(false);

            expect(blockchain.isSynced()).toBeTrue();
        });

        it("should return true if last block is less than 3 blocktimes away from current slot time", () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);

            peerStorage.hasPeers = jest.fn().mockReturnValue(true);
            const mockBlock = { data: { id: "123", height: 444, timestamp: Crypto.Slots.getTime() - 16 }};
            stateStore.getLastBlock = jest.fn().mockReturnValue(mockBlock);
            
            expect(blockchain.isSynced()).toBeTrue();
        });

        it("should return false if last block is more than 3 blocktimes away from current slot time", () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);

            peerStorage.hasPeers = jest.fn().mockReturnValue(true);
            const mockBlock = { data: { id: "123", height: 444, timestamp: Crypto.Slots.getTime() - 25 }};
            stateStore.getLastBlock = jest.fn().mockReturnValue(mockBlock);
            
            expect(blockchain.isSynced()).toBeFalse();
        });
    });

    describe("getLastBlock", () => {
        it("should return the last block from state", () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);

            const mockBlock = { data: { id: "123", height: 444 }};
            stateStore.getLastBlock = jest.fn().mockReturnValue(mockBlock);
            
            expect(blockchain.getLastBlock()).toEqual(mockBlock);
            expect(stateStore.getLastBlock).toHaveBeenCalledTimes(1);
        })
    });

    describe("getLastHeight", () => {
        it("should return the last height using getLastBlock", () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);

            const mockBlock = { data: { id: "123", height: 444 }};
            stateStore.getLastBlock = jest.fn().mockReturnValue(mockBlock);
            const spyGetLastBlock = jest.spyOn(blockchain, "getLastBlock");
            
            expect(blockchain.getLastHeight()).toEqual(mockBlock.data.height);
            expect(spyGetLastBlock).toHaveBeenCalledTimes(1);
        })
    });

    describe("getLastDownloadedBlock", () => {
        it("should return state.lastDownloadedBlock if it is defined", () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);

            const mockBlock = { data: { id: "123", height: 444 }};
            stateStore.lastDownloadedBlock = mockBlock.data;
            
            expect(blockchain.getLastDownloadedBlock()).toEqual(mockBlock.data);
        })

        it("should return getLastBlock().data if state.lastDownloadedBlock is undefined", () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);

            stateStore.lastDownloadedBlock = undefined;
            const mockBlock = { data: { id: "123", height: 444 }};
            stateStore.getLastBlock = jest.fn().mockReturnValue(mockBlock);
            const spyGetLastBlock = jest.spyOn(blockchain, "getLastBlock");
            
            expect(blockchain.getLastDownloadedBlock()).toEqual(mockBlock.data);
            expect(spyGetLastBlock).toHaveBeenCalledTimes(1);
        })
    });

    describe("getBlockPing", () => {
        const mockBlock = { data: { id: "123", height: 444 }};

        it.each([[undefined], [ { block: mockBlock, count: 3 } ]])(
            "should return the value of state.blockPing",
            (blockPing) => {
                const blockchain = container.resolve<Blockchain>(Blockchain);

                stateStore.blockPing = blockPing;
                
                expect(blockchain.getBlockPing()).toEqual(blockPing);
            }
        )
    });

    describe("pingBlock", () => {
        it("should call state.pingBlock", () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            
            const incomingBlock = { id: "123", height: 444 };
            blockchain.pingBlock(incomingBlock as Interfaces.IBlockData);

            expect(stateStore.pingBlock).toBeCalledTimes(1);
            expect(stateStore.pingBlock).toHaveBeenLastCalledWith(incomingBlock);
        })
    });

    describe("pushPingBlock", () => {
        it("should call state.pushPingBlock", () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            
            const incomingBlock = { id: "123", height: 444 };
            const fromForger = true;
            blockchain.pushPingBlock(incomingBlock as Interfaces.IBlockData, fromForger);

            expect(stateStore.pushPingBlock).toBeCalledTimes(1);
            expect(stateStore.pushPingBlock).toHaveBeenLastCalledWith(incomingBlock, fromForger);
        })

        it("should call state.pushPingBlock with fromForger=false if not specified", () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            
            const incomingBlock = { id: "123", height: 444 };
            blockchain.pushPingBlock(incomingBlock as Interfaces.IBlockData);

            expect(stateStore.pushPingBlock).toBeCalledTimes(1);
            expect(stateStore.pushPingBlock).toHaveBeenLastCalledWith(incomingBlock, false);
        })
    });


    describe("checkMissingBlocks", () => {
        const threshold = Managers.configManager.getMilestone().activeDelegates / 3 - 1;

        it("when missedBlocks passes the threshold and Math.random()<=0.8, should checkNetworkHealth", async () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            jest.spyOn(Math, "random").mockReturnValue(0.7);

            peerNetworkMonitor.checkNetworkHealth = jest.fn().mockReturnValue({});
            for (let i = 1; i < threshold; i++) {
                await blockchain.checkMissingBlocks();
                expect(peerNetworkMonitor.checkNetworkHealth).toHaveBeenCalledTimes(0);
            }

            await blockchain.checkMissingBlocks();
            expect(peerNetworkMonitor.checkNetworkHealth).toHaveBeenCalledTimes(1);
        });

        it("when missedBlocks passes the threshold and Math.random()<=0.8, should checkNetworkHealth and dispatch FORK if forked", async () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            jest.spyOn(Math, "random").mockReturnValue(0.7);

            const spyDispatch = jest.spyOn(blockchain, "dispatch");

            peerNetworkMonitor.checkNetworkHealth = jest.fn().mockReturnValue({ forked: true });
            for (let i = 1; i < threshold; i++) {
                await blockchain.checkMissingBlocks();
                expect(peerNetworkMonitor.checkNetworkHealth).toHaveBeenCalledTimes(0);
                expect(spyDispatch).toBeCalledTimes(0);
            }

            await blockchain.checkMissingBlocks();
            expect(peerNetworkMonitor.checkNetworkHealth).toHaveBeenCalledTimes(1);
            expect(spyDispatch).toBeCalledTimes(1);
            expect(spyDispatch).toBeCalledWith("FORK");
        });

        it("when missedBlocks passes the threshold and Math.random()>0.8, should do nothing", async () => {
            const blockchain = container.resolve<Blockchain>(Blockchain);
            jest.spyOn(Math, "random").mockReturnValue(0.9);

            peerNetworkMonitor.checkNetworkHealth = jest.fn().mockReturnValue({});
            for (let i = 1; i < threshold + 10; i++) {
                await blockchain.checkMissingBlocks();
                expect(peerNetworkMonitor.checkNetworkHealth).toHaveBeenCalledTimes(0);
            }
        });
    });
});