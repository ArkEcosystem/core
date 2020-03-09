import "jest-extended";
import delay from "delay";

import { Container, Enums } from "@arkecosystem/core-kernel";
import { Blockchain } from "../../../packages/core-blockchain/src/blockchain";
import { Interfaces, Crypto } from "@arkecosystem/crypto";

describe("Blockchain", () => {
    const container = new Container.Container();

    const logService = { warning: jest.fn(), info: jest.fn(), error: jest.fn(), };
    const stateStore = {
        started: false,
        clearWakeUpTimeout: jest.fn(),
        wakeUpTimeout: undefined,
        lastDownloadedBlock: undefined,
        getLastBlock: jest.fn(),
        pushPingBlock: jest.fn(),
    };
    const databaseService = { getTopBlocks: jest.fn(), loadBlocksFromCurrentRound: jest.fn() };
    const blockRepository = { deleteBlocks: jest.fn() };
    const transactionPoolService = {};
    const stateMachine = { transition: jest.fn() };
    const eventDispatcherService = { listen: jest.fn(), dispatch: jest.fn() };
    const peerNetworkMonitor = { cleansePeers: jest.fn(), updateNetworkStatus: jest.fn() };

    const appContracts = {
        [Container.Identifiers.PeerNetworkMonitor]: peerNetworkMonitor
    };

    const application = {
        log: logService,
        resolve: jest.fn(),
        get: id => appContracts[id],
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
    });

    beforeEach(() => {
        jest.resetAllMocks();
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
        const blockData = { height: 30122 } as Interfaces.IBlockData;

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

        it.todo("divide blocks into chunks");
        it.todo("hitting new milestone");
    });

    describe("removeBlocks", () => {
        it.todo("removeBlocks tests");
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
        it("should process a new chained block", async () => {
            
        });

        it("should process a valid block already known", async () => {
            
        });

        it("should process a new block with database saveBlocks failing once", async () => {
            
        });

        it("should process a new block with database saveBlocks + getLastBlock failing once", async () => {
            
        });

        it("should broadcast a block if (Crypto.Slots.getSlotNumber() * blocktime <= block.data.timestamp)", async () => {
            
        });
    });

    describe("resetLastDownloadedBlock", () => {

    });

    describe("forceWakeup", () => {

    });

    describe("forkBlock", () => {

    });

    describe("isSynced", () => {

    });

    describe("getLastBlock", () => {

    });

    describe("getLastHeight", () => {

    });


    describe("getLastDownloadedBlock", () => {

    });

    describe("getBlockPing", () => {

    });

    describe("pingBlock", () => {

    });

    describe("pushPingBlock", () => {

    });


    describe("checkMissingBlocks", () => {

    });
});