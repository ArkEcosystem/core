import { Container, Utils as KernelUtils } from "@packages/core-kernel";
import { NetworkStateStatus } from "@packages/core-p2p/src/enums";
import { NetworkState } from "@packages/core-p2p/src/network-state";
import { InternalController } from "@packages/core-p2p/src/socket-server/controllers/internal";
import { Sandbox } from "@packages/core-test-framework";
import { Blocks, Networks, Utils } from "@packages/crypto";
import { TransactionFactory } from "@packages/crypto/src/transactions";

describe("InternalController", () => {
    let sandbox: Sandbox;
    let internalController: InternalController;

    const logger = { warning: jest.fn(), debug: jest.fn() };
    const peerProcessor = { validateAndAcceptPeer: jest.fn() };
    const networkMonitor = { getNetworkState: jest.fn() };
    const emitter = { dispatch: jest.fn() };
    const database = { getActiveDelegates: jest.fn() };
    const databaseInteractions = { getActiveDelegates: jest.fn() };
    const poolCollator = { getBlockCandidateTransactions: jest.fn() };
    const poolService = { getPoolSize: jest.fn() };
    const blockchain = { getLastBlock: jest.fn(), forceWakeup: jest.fn() };

    beforeEach(() => {
        sandbox = new Sandbox();

        sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logger);
        sandbox.app.bind(Container.Identifiers.PeerProcessor).toConstantValue(peerProcessor);
        sandbox.app.bind(Container.Identifiers.PeerNetworkMonitor).toConstantValue(networkMonitor);
        sandbox.app.bind(Container.Identifiers.EventDispatcherService).toConstantValue(emitter);
        sandbox.app.bind(Container.Identifiers.DatabaseService).toConstantValue(database);
        sandbox.app.bind(Container.Identifiers.DatabaseInteraction).toConstantValue(databaseInteractions);
        sandbox.app.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);
        sandbox.app.bind(Container.Identifiers.TransactionPoolService).toConstantValue(poolService);
        sandbox.app.bind(Container.Identifiers.TransactionPoolCollator).toConstantValue(poolCollator);

        internalController = sandbox.app.resolve<InternalController>(InternalController);
    });

    describe("acceptNewPeer", () => {
        it("should call peerProcessor.validateAndAcceptPeer with the ip from payload", async () => {
            const ip = "187.155.66.33";
            await internalController.acceptNewPeer({ payload: { ip } }, {});

            expect(peerProcessor.validateAndAcceptPeer).toBeCalledTimes(1);
            expect(peerProcessor.validateAndAcceptPeer).toBeCalledWith({ ip });
        });
    });

    describe("emitEvent", () => {
        it("should call eventDispatcher.dispatch with {event, body} from payload", () => {
            const event = "test event";
            const body = { stuff: "thing" };
            internalController.emitEvent({ payload: { event, body } }, {});

            expect(emitter.dispatch).toBeCalledTimes(1);
            expect(emitter.dispatch).toBeCalledWith(event, body);
        });
    });

    describe("getUnconfirmedTransactions", () => {
        it("should return the unconfirmed transactions from the pool", async () => {
            const poolSize = 330;
            const unconfirmedTxs = Networks.testnet.genesisBlock.transactions.map((tx) =>
                // @ts-ignore
                TransactionFactory.fromData({
                    ...tx,
                    amount: Utils.BigNumber.make(tx.amount),
                    fee: Utils.BigNumber.make(1000000),
                }),
            );
            poolService.getPoolSize = jest.fn().mockReturnValueOnce(poolSize);
            poolCollator.getBlockCandidateTransactions = jest.fn().mockReturnValueOnce(unconfirmedTxs);

            expect(await internalController.getUnconfirmedTransactions({}, {})).toEqual({
                poolSize,
                transactions: unconfirmedTxs.map((tx) => tx.serialized.toString("hex")),
            });
        });
    });

    describe("getCurrentRound", () => {
        // @ts-ignore
        const block = {
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
            },
            transactions: [],
        } as Blocks.Block;

        it("should return the info of the current round", async () => {
            blockchain.getLastBlock = jest.fn().mockReturnValueOnce(block);

            const delegates = [
                {
                    getData: () => {
                        return {
                            publicKey: "026c598170201caf0357f202ff14f365a3b09322071e347873869f58d776bfc565",
                            delegate: "delegate1",
                        };
                    },
                    getAttribute: () => "delegate1",
                },
                {
                    getData: () => {
                        return {
                            publicKey: "026c740930201caf0357f202ff14f365a3b09322071e347873869f58d776bfc565",
                            delegate: "delegate2",
                        };
                    },
                    getAttribute: () => "delegate2",
                },
            ];

            databaseInteractions.getActiveDelegates = jest.fn().mockReturnValueOnce(delegates);
            const forgingInfo = {
                blockTimestamp: 97456,
                currentForger: 0,
                nextForger: 1,
                canForge: true,
            };
            jest.spyOn(KernelUtils.forgingInfoCalculator, "calculateForgingInfo").mockReturnValueOnce(forgingInfo);
            const roundInfo = { round: 1, nextRound: 2, maxDelegates: 71, roundHeight: 1 };
            jest.spyOn(KernelUtils.roundCalculator, "calculateRound").mockReturnValueOnce(roundInfo);

            const currentRound = await internalController.getCurrentRound({}, {});

            const delegatesData = delegates.map((delegate) => {
                return delegate.getData();
            });

            expect(currentRound).toEqual({
                current: roundInfo.round,
                reward: 0,
                timestamp: forgingInfo.blockTimestamp,
                delegates: delegatesData,
                currentForger: delegatesData[forgingInfo.currentForger],
                nextForger: delegatesData[forgingInfo.nextForger],
                lastBlock: block.data,
                canForge: forgingInfo.canForge,
            });
        });
    });

    describe("getNetworkState", () => {
        it("should return peerNetworkMonitor.getNetworkState()", async () => {
            const networkStateMock = new NetworkState(NetworkStateStatus.Default);
            networkMonitor.getNetworkState = jest.fn().mockReturnValueOnce(networkStateMock);

            const networkState = await internalController.getNetworkState({}, {});

            expect(networkState).toEqual(networkStateMock);
            expect(networkMonitor.getNetworkState).toBeCalledTimes(1);
        });
    });

    describe("syncBlockchain", () => {
        it("should call blockchain.forceWakeup()", () => {
            internalController.syncBlockchain({}, {});

            expect(blockchain.forceWakeup).toBeCalledTimes(1);
        });
    });
});
