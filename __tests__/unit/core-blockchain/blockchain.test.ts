import "jest-extended";

import { ProcessBlocksJob } from "@arkecosystem/core-blockchain/src/process-blocks-job";
import { Queue } from "@arkecosystem/core-kernel/dist/contracts/kernel";
import { Identifiers, interfaces } from "@arkecosystem/core-kernel/dist/ioc";
import { MemoryQueue } from "@arkecosystem/core-kernel/src/services/queue/drivers/memory";
import { ProcessBlockAction } from "@packages/core-blockchain/src/actions";
import { Blockchain } from "@packages/core-blockchain/src/blockchain";
import { Container, Enums, Services, Utils as AppUtils } from "@packages/core-kernel";
import { GetActiveDelegatesAction } from "@packages/core-state/src/actions";
import { Sandbox } from "@packages/core-test-framework";
import { Crypto, Interfaces, Managers, Networks, Utils } from "@packages/crypto";
import delay from "delay";
import { EventEmitter } from "events";

EventEmitter.prototype.constructor = Object.prototype.constructor;

describe("Blockchain", () => {
    let sandbox: Sandbox;

    const configuration: any = {};
    const logService: any = {};
    const stateStore: any = {};
    const databaseService: any = {};
    const blockRepository: any = {};
    const transactionPoolService: any = {};
    const stateMachine: any = {};
    const eventDispatcherService: any = {};
    const peerNetworkMonitor: any = {};
    const peerRepository: any = {};
    const blockProcessor: any = {};
    const databaseInteractions: any = {};

    beforeAll(() => {
        sandbox = new Sandbox();

        sandbox.app.bind(Container.Identifiers.PluginConfiguration).toConstantValue(configuration);
        sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logService);
        sandbox.app.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
        sandbox.app.bind(Container.Identifiers.DatabaseService).toConstantValue(databaseService);
        sandbox.app.bind(Container.Identifiers.DatabaseInteraction).toConstantValue(databaseInteractions);
        sandbox.app.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue(blockRepository);
        sandbox.app.bind(Container.Identifiers.TransactionPoolService).toConstantValue(transactionPoolService);
        sandbox.app.bind(Container.Identifiers.StateMachine).toConstantValue(stateMachine);
        sandbox.app.bind(Container.Identifiers.EventDispatcherService).toConstantValue(eventDispatcherService);
        sandbox.app.bind(Container.Identifiers.PeerNetworkMonitor).toConstantValue(peerNetworkMonitor);
        sandbox.app.bind(Container.Identifiers.PeerRepository).toConstantValue(peerRepository);
        sandbox.app.bind(Container.Identifiers.BlockchainService).to(Blockchain).inSingletonScope();
        sandbox.app.bind(Container.Identifiers.BlockProcessor).toConstantValue(blockProcessor);
        sandbox.app.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue({});
        sandbox.app.bind(Container.Identifiers.WalletRepository).toConstantValue({});

        sandbox.app.bind(Container.Identifiers.TriggerService).to(Services.Triggers.Triggers).inSingletonScope();
        sandbox.app
            .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
            .bind("processBlock", new ProcessBlockAction());

        sandbox.app
            .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
            .bind("getActiveDelegates", new GetActiveDelegatesAction(sandbox.app));

        sandbox.app
            .bind(Identifiers.QueueFactory)
            .toFactory((context: interfaces.Context) => async <K, T>(name?: string): Promise<Queue> =>
                sandbox.app.resolve<Queue>(MemoryQueue).make(),
            );

        Managers.configManager.setFromPreset("testnet");
    });

    beforeEach(() => {
        jest.restoreAllMocks();

        configuration.getOptional = jest.fn((key, defaultValue) => defaultValue);

        logService.warning = jest.fn();
        logService.info = jest.fn();
        logService.error = jest.fn();
        logService.debug = jest.fn();

        stateStore.reset = jest.fn();
        stateStore.getMaxLastBlocks = jest.fn().mockReturnValue(200);
        stateStore.clearWakeUpTimeout = jest.fn();
        stateStore.wakeUpTimeout = undefined;
        stateStore.blockPing = undefined;
        stateStore.getGenesisBlock = jest.fn().mockReturnValue({ data: Networks.testnet.genesisBlock });
        stateStore.getLastDownloadedBlock = jest.fn();
        stateStore.setLastDownloadedBlock = jest.fn();
        stateStore.getNumberOfBlocksToRollback = jest.fn().mockReturnValue(0);
        stateStore.setNumberOfBlocksToRollback = jest.fn();
        stateStore.getNetworkStart = jest.fn().mockReturnValue(false);
        stateStore.setNetworkStart = jest.fn();
        stateStore.setLastStoredBlockHeight = jest.fn();
        stateStore.getLastBlock = jest.fn();
        stateStore.setLastBlock = jest.fn();
        stateStore.setForkedBlock = jest.fn();
        stateStore.setWakeUpTimeout = jest.fn();
        stateStore.pushPingBlock = jest.fn();
        stateStore.pingBlock = jest.fn();

        databaseService.deleteRound = jest.fn();
        databaseService.revertBlock = jest.fn();

        databaseInteractions.getTopBlocks = jest.fn();
        databaseInteractions.getLastBlock = jest.fn();
        databaseInteractions.restoreCurrentRound = jest.fn();
        databaseInteractions.revertBlock = jest.fn();
        databaseInteractions.deleteRound = jest.fn();
        databaseInteractions.getActiveDelegates = jest.fn().mockReturnValue([]);

        blockRepository.deleteBlocks = jest.fn();
        blockRepository.deleteTopBlocks = jest.fn();
        blockRepository.saveBlocks = jest.fn();

        stateMachine.transition = jest.fn();

        eventDispatcherService.listen = jest.fn();
        eventDispatcherService.dispatch = jest.fn();

        peerNetworkMonitor.cleansePeers = jest.fn();
        peerNetworkMonitor.broadcastBlock = jest.fn();
        peerNetworkMonitor.checkNetworkHealth = jest.fn();

        peerRepository.hasPeers = jest.fn();

        blockProcessor.process = jest.fn();

        transactionPoolService.readdTransactions = jest.fn();
    });

    describe("initialize", () => {
        it("should log a warning if networkStart option is provided", () => {
            configuration.getOptional.mockReturnValueOnce(true);
            stateStore.getNetworkStart = jest.fn().mockReturnValue(true);

            sandbox.app.resolve<Blockchain>(Blockchain);

            expect(logService.warning).toBeCalledTimes(1);
            expect(stateStore.setNetworkStart).toHaveBeenCalledWith(true);
        });

        it("should not log a warning if networkStart option isn't provided", () => {
            sandbox.app.resolve<Blockchain>(Blockchain);
            expect(logService.warning).toBeCalledTimes(0);
        });
    });

    describe("getQueue", () => {
        it("should return instance of queue", async () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            await blockchain.initialize();

            expect(blockchain.getQueue()).toBeInstanceOf(MemoryQueue);
        });
    });

    describe("dispatch", () => {
        it("should call transition method on stateMachine with the event provided", () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            const eventToDispatch = "any.event.to.dispatch";

            expect(stateMachine.transition).toBeCalledTimes(0);
            blockchain.dispatch(eventToDispatch);
            expect(stateMachine.transition).toBeCalledTimes(1);
            expect(stateMachine.transition).toHaveBeenLastCalledWith(eventToDispatch);
        });
    });

    describe("boot", () => {
        it("should dispatch 'START'", async () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            const spyDispatch = jest.spyOn(blockchain, "dispatch");

            expect(blockchain.isBooted()).toBeFalse();
            stateStore.isStarted = jest.fn().mockReturnValue(true);
            await blockchain.boot();

            expect(spyDispatch).toBeCalledTimes(1);
            expect(spyDispatch).toHaveBeenLastCalledWith("START");
            expect(blockchain.isBooted()).toBeTrue();
        });

        it("should dispatch START and return true even if stateStore is not ready when skipStartedCheck === true", async () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
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
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);

            stateStore.isStarted = jest.fn().mockReturnValue(false);
            const resolved = jest.fn();
            const checkBootResolved = async () => {
                await blockchain.boot();
                resolved();
            };
            checkBootResolved();

            // will not resolve after 2 seconds while stateStore.started is false
            await delay(2000);
            expect(resolved).toBeCalledTimes(0);

            // will resolve after 1 second when stateStore.started is true
            stateStore.isStarted = jest.fn().mockReturnValue(true);
            await delay(1100);

            expect(resolved).toBeCalledTimes(1);
        });

        it("should call cleansePeers and set listener on ForgerEvent.Missing and RoundEvent.Applied", async () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            stateStore.isStarted = jest.fn().mockReturnValue(true);

            expect(peerNetworkMonitor.cleansePeers).toBeCalledTimes(0);

            await blockchain.boot();

            expect(peerNetworkMonitor.cleansePeers).toBeCalledTimes(1);
            expect(eventDispatcherService.listen).toHaveBeenCalledTimes(2);
            expect(eventDispatcherService.listen).toHaveBeenNthCalledWith(1, Enums.ForgerEvent.Missing, {
                handle: expect.any(Function),
            });
            expect(eventDispatcherService.listen).toHaveBeenNthCalledWith(2, Enums.RoundEvent.Applied, {
                handle: expect.any(Function),
            });
        });
    });

    describe("dispose", () => {
        it("should call clearWakeUpTimeout on stateStore and dispatch 'STOP'", async () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            await blockchain.initialize();

            const spyDispatch = jest.spyOn(blockchain, "dispatch");

            expect(blockchain.isStopped()).toBeFalse();
            await blockchain.dispose();

            expect(stateStore.clearWakeUpTimeout).toBeCalledTimes(1);
            expect(spyDispatch).toBeCalledTimes(1);
            expect(spyDispatch).toHaveBeenLastCalledWith("STOP");
            expect(blockchain.isStopped()).toBeTrue();
        });

        it("should ignore if already stopped", async () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            const spyDispatch = jest.spyOn(blockchain, "dispatch");

            // @ts-ignore
            blockchain.stopped = true;

            await blockchain.dispose();

            expect(spyDispatch).not.toHaveBeenCalled();
        });
    });

    describe("setWakeUp", () => {
        it("should set wakeUpTimeout on stateStore", () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);

            blockchain.setWakeUp();
            expect(stateStore.setWakeUpTimeout).toHaveBeenCalled();
        });

        it("should dispatch WAKEUP when wake up function is called", () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            const spyDispatch = jest.spyOn(blockchain, "dispatch");

            blockchain.setWakeUp();
            expect(spyDispatch).toBeCalledTimes(0);

            expect(stateStore.setWakeUpTimeout).toHaveBeenCalledWith(expect.toBeFunction(), 60000);

            // Call given callback function
            stateStore.setWakeUpTimeout.mock.calls[0][0]();

            expect(spyDispatch).toBeCalledTimes(1);
            expect(spyDispatch).toBeCalledWith("WAKEUP");
        });
    });

    describe("resetWakeUp", () => {
        it("should call stateStore clearWakeUpTimeout and own setWakeUp method", () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            const spySetWakeUp = jest.spyOn(blockchain, "setWakeUp");

            blockchain.resetWakeUp();

            expect(stateStore.clearWakeUpTimeout).toBeCalledTimes(1);
            expect(spySetWakeUp).toBeCalledTimes(1);
        });
    });

    describe("clearAndStopQueue", () => {
        it("should set state.lastDownloadedBlock from this.getLastBlock() and clear queue", async () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            await blockchain.initialize();

            const spyClearQueue = jest.spyOn(blockchain, "clearQueue");
            stateStore.getLastDownloadedBlock = jest.fn();
            stateStore.setLastDownloadedBlock = jest.fn();
            const mockLastBlock = { data: { id: "abcd1234" } };
            stateStore.getLastBlock = jest.fn().mockImplementation(() => mockLastBlock);

            blockchain.clearAndStopQueue();

            expect(stateStore.setLastDownloadedBlock).toHaveBeenCalledWith(mockLastBlock.data);
            expect(spyClearQueue).toBeCalledTimes(1);
        });
    });

    describe("clearQueue", () => {
        it("should call queue.clear", async () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            await blockchain.initialize();

            // @ts-ignore
            const spyQueueClear = jest.spyOn(blockchain.queue, "clear");

            blockchain.clearQueue();

            expect(spyQueueClear).toBeCalledTimes(1);
        });
    });

    describe("handleIncomingBlock", () => {
        const blockData = { height: 30122 } as Interfaces.IBlockData;

        beforeEach(() => {
            jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValue(1);

            const getTimeStampForBlock = (height: number) => {
                switch (height) {
                    case 1:
                        return 0;
                    default:
                        throw new Error(`Test scenarios should not hit this line`);
                }
            };

            const spyblockTimeLookup = jest.spyOn(AppUtils.forgingInfoCalculator, "getBlockTimeLookup");

            spyblockTimeLookup.mockResolvedValue(getTimeStampForBlock);
        });

        describe("when state is started", () => {
            it("should dispatch 'NEWBLOCK', BlockEvent.Received and enqueue the block", async () => {
                const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
                const spyDispatch = jest.spyOn(blockchain, "dispatch");
                const spyEnqueue = jest.spyOn(blockchain, "enqueueBlocks");
                stateStore.started = true;
                stateStore.getLastBlock = jest.fn().mockReturnValue({ data: blockData });

                await blockchain.handleIncomingBlock(blockData);

                expect(spyDispatch).toBeCalledTimes(1);
                expect(spyDispatch).toHaveBeenLastCalledWith("NEWBLOCK");

                expect(eventDispatcherService.dispatch).toBeCalledTimes(1);
                expect(eventDispatcherService.dispatch).toHaveBeenLastCalledWith(Enums.BlockEvent.Received, blockData);

                expect(spyEnqueue).toBeCalledTimes(1);
                expect(spyEnqueue).toHaveBeenLastCalledWith([blockData]);
            });

            it("should not dispatch anything nor enqueue the block if receivedSlot > currentSlot", async () => {
                const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
                const spyEnqueue = jest.spyOn(blockchain, "enqueueBlocks");
                stateStore.started = true;
                stateStore.getLastBlock = jest.fn().mockReturnValue({ data: blockData });

                jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValueOnce(1).mockReturnValueOnce(2);

                await blockchain.handleIncomingBlock(blockData);

                expect(spyEnqueue).toBeCalledTimes(0);
                expect(eventDispatcherService.dispatch).toBeCalledTimes(0);
            });

            it("should handle block from forger if in right slot", async () => {
                const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
                const spyEnqueue = jest.spyOn(blockchain, "enqueueBlocks");
                const spyDispatch = jest.spyOn(blockchain, "dispatch");
                stateStore.started = true;
                stateStore.getLastBlock = jest.fn().mockReturnValue({ data: blockData });

                jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValueOnce(1).mockReturnValueOnce(1);
                jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot").mockReturnValueOnce(5000);

                await blockchain.handleIncomingBlock(blockData, true);

                expect(spyEnqueue).toBeCalledTimes(1);
                expect(spyEnqueue).toHaveBeenLastCalledWith([blockData]);
                expect(spyDispatch).toBeCalledTimes(1);
                expect(spyDispatch).toHaveBeenLastCalledWith("NEWBLOCK");
            });

            it.each([[true], [false]])("should not handle block if in wrong slot", async (fromForger) => {
                const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
                const spyEnqueue = jest.spyOn(blockchain, "enqueueBlocks");
                const spyDispatch = jest.spyOn(blockchain, "dispatch");
                stateStore.started = true;
                stateStore.getLastBlock = jest.fn().mockReturnValue({ data: blockData });

                jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValueOnce(1).mockReturnValueOnce(2);
                jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot").mockReturnValueOnce(5000);

                await blockchain.handleIncomingBlock(blockData, fromForger);

                expect(spyEnqueue).toBeCalledTimes(0);
                expect(spyDispatch).toBeCalledTimes(0);
            });

            it("should not handle block from forger if less than 2 seconds left in slot", async () => {
                const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
                const spyEnqueue = jest.spyOn(blockchain, "enqueueBlocks");
                const spyDispatch = jest.spyOn(blockchain, "dispatch");
                stateStore.started = true;
                stateStore.getLastBlock = jest.fn().mockReturnValue({ data: blockData });

                jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValueOnce(1).mockReturnValueOnce(1);
                jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot").mockReturnValueOnce(1500);

                await blockchain.handleIncomingBlock(blockData, true);

                expect(spyEnqueue).toBeCalledTimes(0);
                expect(spyDispatch).toBeCalledTimes(0);
            }, 10000);

            it("should handle block if not from forger if less than 2 seconds left in slot", async () => {
                const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
                const spyEnqueue = jest.spyOn(blockchain, "enqueueBlocks");
                const spyDispatch = jest.spyOn(blockchain, "dispatch");
                stateStore.started = true;
                stateStore.getLastBlock = jest.fn().mockReturnValue({ data: blockData });

                jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValueOnce(1).mockReturnValueOnce(1);
                jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot").mockReturnValueOnce(1500);

                await blockchain.handleIncomingBlock(blockData);

                expect(spyEnqueue).toBeCalledTimes(1);
                expect(spyEnqueue).toHaveBeenLastCalledWith([blockData]);
                expect(spyDispatch).toBeCalledTimes(1);
                expect(spyDispatch).toHaveBeenLastCalledWith("NEWBLOCK");
            }, 10000);
        });

        describe("when state is not started", () => {
            it("should dispatch BlockEvent.Disregarded and not enqueue the block", async () => {
                const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
                const spyEnqueue = jest.spyOn(blockchain, "enqueueBlocks");
                stateStore.isStarted = jest.fn().mockReturnValue(false);

                await blockchain.handleIncomingBlock(blockData);

                expect(eventDispatcherService.dispatch).toBeCalledTimes(1);
                expect(eventDispatcherService.dispatch).toHaveBeenLastCalledWith(
                    Enums.BlockEvent.Disregarded,
                    blockData,
                );

                expect(spyEnqueue).toBeCalledTimes(0);
            });
        });

        it("should not dispatch anything nor enqueue the block if receivedSlot > currentSlot", () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            const spyEnqueue = jest.spyOn(blockchain, "enqueueBlocks");

            jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValueOnce(1).mockReturnValueOnce(2);

            blockchain.handleIncomingBlock(blockData);

            expect(spyEnqueue).toBeCalledTimes(0);
            expect(eventDispatcherService.dispatch).toBeCalledTimes(0);
        });
    });

    describe("enqueueBlocks", () => {
        const blockData = { height: 30122, numberOfTransactions: 0 } as Interfaces.IBlockData;

        it("should just return if blocks provided are an empty array", async () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            await blockchain.initialize();

            // @ts-ignore
            const spyQueuePush = jest.spyOn(blockchain.queue, "push");

            blockchain.enqueueBlocks([]);
            expect(spyQueuePush).not.toHaveBeenCalled();
        });

        it("should enqueue the blocks", async () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            await blockchain.initialize();

            stateStore.getLastDownloadedBlock = jest.fn().mockReturnValue({ height: 23111 });

            // @ts-ignore
            const spyQueuePush = jest.spyOn(blockchain.queue, "push");
            const spySetBlocks = jest.spyOn(ProcessBlocksJob.prototype, "setBlocks");

            blockchain.enqueueBlocks([blockData]);

            expect(spyQueuePush).toHaveBeenCalled();
            expect(spySetBlocks).toHaveBeenCalledWith([blockData]);
        });

        it("should push a chunk to the queue when currentTransactionsCount >= 150", async () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            await blockchain.initialize();

            stateStore.getLastDownloadedBlock = jest.fn().mockReturnValue({ height: 23111 });

            // @ts-ignore
            const spyQueuePush = jest.spyOn(blockchain.queue, "push");
            const spySetBlocks = jest.spyOn(ProcessBlocksJob.prototype, "setBlocks");

            const blockWith150Txs = {
                height: blockData.height + 1,
                numberOfTransactions: 150,
            } as Interfaces.IBlockData;

            blockchain.enqueueBlocks([blockWith150Txs, blockData]);

            expect(spyQueuePush).toHaveBeenCalledTimes(2);
            expect(spySetBlocks).toHaveBeenCalledWith([blockWith150Txs]);
            expect(spySetBlocks).toHaveBeenCalledWith([blockData]);
        });

        it("should push a chunk to the queue when currentBlocksChunk.length >= 100", async () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            await blockchain.initialize();

            stateStore.getLastDownloadedBlock = jest.fn().mockReturnValue({ height: 23111 });

            // @ts-ignore
            const spyQueuePush = jest.spyOn(blockchain.queue, "push");
            const spySetBlocks = jest.spyOn(ProcessBlocksJob.prototype, "setBlocks");

            const blocksToEnqueue = [];
            for (let i = 0; i < 101; i++) {
                // @ts-ignore
                blocksToEnqueue.push(blockData);
            }
            blockchain.enqueueBlocks(blocksToEnqueue);

            expect(spyQueuePush).toHaveBeenCalledTimes(2);
            expect(spySetBlocks).toHaveBeenCalledWith(blocksToEnqueue.slice(-1));
            expect(spySetBlocks).toHaveBeenCalledWith([blockData]);
        });

        it("should push a chunk to the queue when hitting new milestone", async () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            await blockchain.initialize();

            stateStore.getLastDownloadedBlock = jest.fn().mockReturnValue({ height: 23111 });

            // @ts-ignore
            const spyQueuePush = jest.spyOn(blockchain.queue, "push");
            const spySetBlocks = jest.spyOn(ProcessBlocksJob.prototype, "setBlocks");

            const blockMilestone = { id: "123", height: 75600 } as Interfaces.IBlockData;
            const blockAfterMilestone = { id: "456", height: 75601 } as Interfaces.IBlockData;
            blockchain.enqueueBlocks([blockMilestone, blockAfterMilestone]);

            expect(spyQueuePush).toHaveBeenCalledTimes(2);
            expect(spySetBlocks).toHaveBeenCalledWith([blockMilestone]);
            expect(spySetBlocks).toHaveBeenCalledWith([blockAfterMilestone]);
        });
    });

    const blockHeight1 = {
        data: {
            id: "17184958558311101492",
            version: 0,
            timestamp: 0,
            height: 1,
        },
        transactions: [],
    };
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
        transactions: [],
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
        transactions: [],
    };
    describe("removeBlocks", () => {
        it("should call revertBlock and setLastBlock for each block to be removed, and deleteBlocks with all blocks removed", async () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            await blockchain.initialize();

            const blocksToRemove = [blockHeight1, blockHeight2, blockHeight3];
            stateStore.getLastBlock = jest
                .fn()
                .mockReturnValueOnce(blocksToRemove[2]) // called in clearAndStopQueue
                .mockReturnValueOnce(blocksToRemove[2]) // called in removeBlocks
                .mockReturnValueOnce(blocksToRemove[2]) // called in __removeBlocks
                .mockReturnValueOnce(blocksToRemove[2]) // called in revertLastBlock
                .mockReturnValueOnce(blocksToRemove[1]) // called in __removeBlocks
                .mockReturnValueOnce(blocksToRemove[1]) // called in revertLastBlock
                .mockReturnValueOnce(blockHeight1); // called in validation process
            databaseService.getBlocks = jest
                .fn()
                .mockReturnValueOnce(blocksToRemove.map((b) => ({ ...b.data, transactions: b.transactions })));

            databaseService.getLastBlock = jest.fn().mockReturnValueOnce(blockHeight1);

            await blockchain.removeBlocks(2);

            expect(databaseInteractions.revertBlock).toHaveBeenCalledTimes(2);
            expect(stateStore.setLastBlock).toHaveBeenCalledTimes(2);
            expect(blockRepository.deleteBlocks).toHaveBeenCalledTimes(1);
            expect(stateStore.setLastStoredBlockHeight).toHaveBeenCalledTimes(1);
            expect(stateStore.setLastStoredBlockHeight).toHaveBeenCalledWith(1);
        });

        it("should default to removing until genesis block when asked to remove more", async () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            await blockchain.initialize();

            const genesisBlock = Networks.testnet.genesisBlock;
            stateStore.getLastBlock = jest
                .fn()
                .mockReturnValueOnce(blockHeight2) // called in clearAndStopQueue
                .mockReturnValueOnce(blockHeight2) // called in removeBlocks
                .mockReturnValueOnce(blockHeight2) // called in __removeBlocks
                .mockReturnValueOnce(blockHeight2) // called in revertLastBlock
                .mockReturnValue({ data: genesisBlock });
            databaseService.getBlocks = jest
                .fn()
                .mockReturnValueOnce([genesisBlock, { ...blockHeight2.data, transactions: blockHeight2.transactions }]);
            databaseService.getLastBlock = jest.fn().mockReturnValue({ data: genesisBlock });

            await blockchain.removeBlocks(blockHeight2.data.height + 10);

            expect(databaseInteractions.revertBlock).toHaveBeenCalledTimes(1);
            expect(stateStore.setLastBlock).toHaveBeenCalledTimes(1);
            expect(stateStore.setLastBlock).toHaveBeenCalledWith({ data: genesisBlock });
            expect(blockRepository.deleteBlocks).toHaveBeenCalledTimes(1);
            expect(stateStore.setLastStoredBlockHeight).toHaveBeenCalledTimes(1);
            expect(stateStore.setLastStoredBlockHeight).toHaveBeenCalledWith(1);
        });

        it("should throw if last database block is not the same as last state block", async () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            await blockchain.initialize();

            // @ts-ignore
            const spyOnProcessExit = jest.spyOn(process, "exit").mockImplementation(() => {});
            const blocksToRemove = [blockHeight1, blockHeight2, blockHeight3];
            stateStore.getLastBlock = jest
                .fn()
                .mockReturnValueOnce(blocksToRemove[2]) // called in clearAndStopQueue
                .mockReturnValueOnce(blocksToRemove[2]) // called in removeBlocks
                .mockReturnValueOnce(blocksToRemove[2]) // called in __removeBlocks
                .mockReturnValueOnce(blocksToRemove[2]) // called in revertLastBlock
                .mockReturnValueOnce(blocksToRemove[1]) // called in __removeBlocks
                .mockReturnValueOnce(blocksToRemove[1]) // called in revertLastBlock
                .mockReturnValue(blockHeight1); // called in validation process
            databaseService.getBlocks = jest
                .fn()
                .mockReturnValueOnce(blocksToRemove.map((b) => ({ ...b.data, transactions: b.transactions })));

            databaseService.getLastBlock = jest.fn().mockReturnValueOnce(blockHeight3);

            await blockchain.removeBlocks(2);

            expect(logService.error).toHaveBeenCalledTimes(1);
            expect(logService.error.mock.calls[0][0]).toContain(
                `Last stored block (${blockHeight3.data.id}) is not the same as last block from state store (${blockHeight1.data.id})`,
            );
            expect(logService.warning).toHaveBeenCalledTimes(1);
            expect(spyOnProcessExit).toHaveBeenCalledTimes(1);
        });

        it("should log error and exit process, when error is thrown", async () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            await blockchain.initialize();

            // @ts-ignore
            const spyOnProcessExit = jest.spyOn(process, "exit").mockImplementation(() => {});

            await blockchain.removeBlocks(0);

            expect(logService.error).toHaveBeenCalledTimes(1);
            expect(logService.warning).toHaveBeenCalledTimes(1);
            expect(spyOnProcessExit).toHaveBeenCalledTimes(1);
        });
    });

    describe("removeTopBlocks", () => {
        it.each([[1], [5], [1329]])(
            "should call deleteTopBlocks with blockRepository and call loadBlocksFromCurrentRound",
            async (numberOfBlocks) => {
                databaseService.getLastBlock = jest.fn().mockReturnValueOnce(blockHeight1);

                const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);

                await blockchain.removeTopBlocks(numberOfBlocks);

                expect(blockRepository.deleteTopBlocks).toHaveBeenLastCalledWith(numberOfBlocks);
            },
        );
    });

    describe("resetLastDownloadedBlock", () => {
        it("should set this.state.lastDownloadedBlock = this.getLastBlock().data", () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);

            const mockBlock = { data: { id: "123", height: 444 } };
            stateStore.getLastBlock = jest.fn().mockReturnValue(mockBlock);

            blockchain.resetLastDownloadedBlock();

            expect(stateStore.setLastDownloadedBlock).toHaveBeenCalledWith(mockBlock.data);
        });
    });

    describe("forceWakeup", () => {
        it("should clearWakeUpTimeout and dispatch 'WAKEUP", () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            const spyDispatch = jest.spyOn(blockchain, "dispatch");

            blockchain.forceWakeup();

            expect(stateStore.clearWakeUpTimeout).toBeCalledTimes(1);
            expect(spyDispatch).toBeCalledTimes(1);
            expect(spyDispatch).toHaveBeenLastCalledWith("WAKEUP");
        });
    });

    describe("forkBlock", () => {
        it("should set forkedBlock, clear and stop queue and dispatch 'FORK'", async () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            await blockchain.initialize();

            const forkedBlock = { data: { id: "1234", height: 8877 } };
            const numberOfBlocksToRollback = 34;
            const spyClearAndStopQueue = jest.spyOn(blockchain, "clearAndStopQueue");
            const spyDispatch = jest.spyOn(blockchain, "dispatch");
            const mockBlock = { data: { id: "123", height: 444 } };
            stateStore.getLastBlock = jest.fn().mockReturnValue(mockBlock);

            blockchain.forkBlock(forkedBlock as Interfaces.IBlock, numberOfBlocksToRollback);

            expect(stateStore.setForkedBlock).toHaveBeenCalledWith(forkedBlock);
            expect(stateStore.setNumberOfBlocksToRollback).toHaveBeenCalledWith(numberOfBlocksToRollback);
            expect(spyClearAndStopQueue).toBeCalledTimes(1);
            expect(spyDispatch).toBeCalledTimes(1);
            expect(spyDispatch).toHaveBeenLastCalledWith("FORK");
        });
    });

    describe("isSynced", () => {
        it("should return true if we have no peer", () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);

            peerRepository.hasPeers = jest.fn().mockReturnValue(false);

            expect(blockchain.isSynced()).toBeTrue();
        });

        it("should return true if last block is less than 3 blocktimes away from current slot time", () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);

            peerRepository.hasPeers = jest.fn().mockReturnValue(true);
            const mockBlock = { data: { id: "123", height: 444, timestamp: Crypto.Slots.getTime() - 16 } };
            stateStore.getLastBlock = jest.fn().mockReturnValue(mockBlock);

            expect(blockchain.isSynced()).toBeTrue();
        });

        it("should return false if last block is more than 3 blocktimes away from current slot time", () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);

            peerRepository.hasPeers = jest.fn().mockReturnValue(true);
            const mockBlock = { data: { id: "123", height: 444, timestamp: Crypto.Slots.getTime() - 25 } };
            stateStore.getLastBlock = jest.fn().mockReturnValue(mockBlock);

            expect(blockchain.isSynced()).toBeFalse();
        });
    });

    describe("getLastBlock", () => {
        it("should return the last block from state", () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);

            const mockBlock = { data: { id: "123", height: 444 } };
            stateStore.getLastBlock = jest.fn().mockReturnValue(mockBlock);

            expect(blockchain.getLastBlock()).toEqual(mockBlock);
            expect(stateStore.getLastBlock).toHaveBeenCalledTimes(1);
        });
    });

    describe("getLastHeight", () => {
        it("should return the last height using getLastBlock", () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);

            const mockBlock = { data: { id: "123", height: 444 } };
            stateStore.getLastBlock = jest.fn().mockReturnValue(mockBlock);
            const spyGetLastBlock = jest.spyOn(blockchain, "getLastBlock");

            expect(blockchain.getLastHeight()).toEqual(mockBlock.data.height);
            expect(spyGetLastBlock).toHaveBeenCalledTimes(1);
        });
    });

    describe("getLastDownloadedBlock", () => {
        it("should return state.lastDownloadedBlock if it is defined", () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);

            const mockBlock = { data: { id: "123", height: 444 } };
            stateStore.getLastDownloadedBlock = jest.fn().mockReturnValue(mockBlock.data);

            expect(blockchain.getLastDownloadedBlock()).toEqual(mockBlock.data);
        });

        it("should return getLastBlock().data if state.lastDownloadedBlock is undefined", () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);

            const mockBlock = { data: { id: "123", height: 444 } };
            stateStore.getLastBlock = jest.fn().mockReturnValue(mockBlock);
            const spyGetLastBlock = jest.spyOn(blockchain, "getLastBlock");

            expect(blockchain.getLastDownloadedBlock()).toEqual(mockBlock.data);
            expect(spyGetLastBlock).toHaveBeenCalledTimes(1);
        });
    });

    describe("getBlockPing", () => {
        const mockBlock = { data: { id: "123", height: 444 } };

        it.each([[undefined], [{ block: mockBlock, count: 3 }]])(
            "should return the value of state.blockPing",
            (blockPing) => {
                const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);

                stateStore.getBlockPing = jest.fn().mockReturnValue(blockPing);

                expect(blockchain.getBlockPing()).toEqual(blockPing);
            },
        );
    });

    describe("pingBlock", () => {
        it("should call state.pingBlock", () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);

            const incomingBlock = { id: "123", height: 444 };
            blockchain.pingBlock(incomingBlock as Interfaces.IBlockData);

            expect(stateStore.pingBlock).toBeCalledTimes(1);
            expect(stateStore.pingBlock).toHaveBeenLastCalledWith(incomingBlock);
        });
    });

    describe("pushPingBlock", () => {
        it("should call state.pushPingBlock", () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);

            const incomingBlock = { id: "123", height: 444 };
            const fromForger = true;
            blockchain.pushPingBlock(incomingBlock as Interfaces.IBlockData, fromForger);

            expect(stateStore.pushPingBlock).toBeCalledTimes(1);
            expect(stateStore.pushPingBlock).toHaveBeenLastCalledWith(incomingBlock, fromForger);
        });

        it("should call state.pushPingBlock with fromForger=false if not specified", () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);

            const incomingBlock = { id: "123", height: 444 };
            blockchain.pushPingBlock(incomingBlock as Interfaces.IBlockData);

            expect(stateStore.pushPingBlock).toBeCalledTimes(1);
            expect(stateStore.pushPingBlock).toHaveBeenLastCalledWith(incomingBlock, false);
        });
    });

    describe("checkMissingBlocks", () => {
        const threshold = Managers.configManager.getMilestone().activeDelegates / 3 - 1;

        it("when missedBlocks passes the threshold and Math.random()<=0.8, should checkNetworkHealth", async () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            jest.spyOn(Math, "random").mockReturnValue(0.7);

            peerNetworkMonitor.checkNetworkHealth = jest.fn().mockReturnValue({});
            for (let i = 1; i < threshold; i++) {
                await blockchain.checkMissingBlocks();
                expect(peerNetworkMonitor.checkNetworkHealth).toHaveBeenCalledTimes(0);
            }

            await blockchain.checkMissingBlocks();
            expect(peerNetworkMonitor.checkNetworkHealth).toHaveBeenCalledTimes(1);
        });

        it("should skip checkNetworkHealth if last check occurs in past 10 minutes", async () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            jest.spyOn(Math, "random").mockReturnValue(0.7);

            peerNetworkMonitor.checkNetworkHealth = jest.fn().mockReturnValue({});
            // @ts-ignore
            blockchain.missedBlocks = threshold;
            // @ts-ignore
            blockchain.lastCheckNetworkHealthTs = Date.now();

            await blockchain.checkMissingBlocks();
            expect(peerNetworkMonitor.checkNetworkHealth).toHaveBeenCalledTimes(0);

            // @ts-ignore
            blockchain.missedBlocks = threshold;
            // @ts-ignore
            blockchain.lastCheckNetworkHealthTs = Date.now() - 11 * 60 * 1000;
            await blockchain.checkMissingBlocks();
            expect(peerNetworkMonitor.checkNetworkHealth).toHaveBeenCalledTimes(1);
        });

        it("when missedBlocks passes the threshold and Math.random()<=0.8, should checkNetworkHealth and dispatch FORK if forked", async () => {
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
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
            const blockchain = sandbox.app.resolve<Blockchain>(Blockchain);
            jest.spyOn(Math, "random").mockReturnValue(0.9);

            peerNetworkMonitor.checkNetworkHealth = jest.fn().mockReturnValue({});
            for (let i = 1; i < threshold + 10; i++) {
                await blockchain.checkMissingBlocks();
                expect(peerNetworkMonitor.checkNetworkHealth).toHaveBeenCalledTimes(0);
            }
        });
    });
});
