import { Container, Services } from "@arkecosystem/core-kernel";
import { BlockProcessorResult } from "@packages/core-blockchain/src/processor";
import { UnchainedHandler } from "@packages/core-blockchain/src/processor/handlers/unchained-handler";
import { GetActiveDelegatesAction } from "@packages/core-state/src/actions";
import { Sandbox } from "@packages/core-test-framework";
import { Interfaces } from "@packages/crypto";

let sandbox: Sandbox;

const logger = { warning: jest.fn(), debug: console.log, info: jest.fn() };
const blockchain = {
    resetLastDownloadedBlock: jest.fn(),
    clearQueue: jest.fn(),
    getLastBlock: jest.fn(),
    getQueue: jest.fn().mockReturnValue({ size: jest.fn() }),
};
const stateStore = {
    getNumberOfBlocksToRollback: jest.fn().mockReturnValue(0),
    setNumberOfBlocksToRollback: jest.fn(),
};
const database = {};
const databaseInteractions = {
    walletRepository: {
        getNonce: jest.fn(),
    },
    getTopBlocks: jest.fn(),
    getLastBlock: jest.fn(),
    loadBlocksFromCurrentRound: jest.fn(),
    revertBlock: jest.fn(),
    deleteRound: jest.fn(),
};

const roundState = {
    getActiveDelegates: jest.fn().mockReturnValue([]),
};

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
    sandbox.app.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);
    sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logger);
    sandbox.app.bind(Container.Identifiers.DatabaseService).toConstantValue(database);
    sandbox.app.bind(Container.Identifiers.DatabaseInteraction).toConstantValue(databaseInteractions);
    sandbox.app.bind(Container.Identifiers.RoundState).toConstantValue(roundState);

    sandbox.app.bind(Container.Identifiers.TriggerService).to(Services.Triggers.Triggers).inSingletonScope();
    sandbox.app
        .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
        .bind("getActiveDelegates", new GetActiveDelegatesAction(sandbox.app));
});

describe("UnchainedHandler", () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe("execute", () => {
        describe("when it is a double forging case", () => {
            it("should return Rollback if block generator is active delegate", async () => {
                const unchainedHandler = sandbox.app.resolve<UnchainedHandler>(UnchainedHandler);
                unchainedHandler.initialize(true);

                const lastBlock = { data: { id: "123", height: 443, timestamp: 111112 } };
                const block = {
                    data: {
                        id: "987",
                        height: 443,
                        timestamp: 111122,
                        generatorPublicKey: "03ea97a59522c4cb4bb3420fc94555f6223813d9817dd421bf533b390a7ea140db",
                    },
                };
                blockchain.getLastBlock = jest.fn().mockReturnValueOnce(lastBlock);
                roundState.getActiveDelegates = jest.fn().mockResolvedValueOnce(
                    [
                        block.data.generatorPublicKey,
                        "02aea83a44f1d6b073e5bcffb4176bbe3c51dcd0e96a793a88f3a6135600224adf",
                        "03a3c6fd74a23fbe1e02f08d9c626ebb255b48de7ba8c283ee27c9303be81a2933",
                    ].map((publicKey) => ({
                        getPublicKey: () => {
                            return publicKey;
                        },
                    })),
                );

                const result = await unchainedHandler.execute(block as Interfaces.IBlock);

                expect(result).toBe(BlockProcessorResult.Rollback);
            });

            it("should return Rejected if block generator is not an active delegate", async () => {
                const unchainedHandler = sandbox.app.resolve<UnchainedHandler>(UnchainedHandler);
                unchainedHandler.initialize(true);

                const lastBlock = { data: { id: "123", height: 443, timestamp: 111112 } };
                const block = {
                    data: {
                        id: "987",
                        height: 443,
                        timestamp: 111122,
                        generatorPublicKey: "03ea97a59522c4cb4bb3420fc94555f6223813d9817dd421bf533b390a7ea140db",
                    },
                };
                blockchain.getLastBlock = jest.fn().mockReturnValueOnce(lastBlock);
                roundState.getActiveDelegates = jest.fn().mockResolvedValueOnce(
                    [
                        "02aea83a44f1d6b073e5bcffb4176bbe3c51dcd0e96a793a88f3a6135600224adf",
                        "03a3c6fd74a23fbe1e02f08d9c626ebb255b48de7ba8c283ee27c9303be81a2933",
                    ].map((publicKey) => ({
                        getPublicKey: () => {
                            return publicKey;
                        },
                    })),
                );

                const result = await unchainedHandler.execute(block as Interfaces.IBlock);

                expect(result).toBe(BlockProcessorResult.Rejected);
            });
        });

        describe("when it is a NotReadyToAcceptNewHeight case", () => {
            it("should return Rejected when height > lastBlock height +1", async () => {
                const unchainedHandler = sandbox.app.resolve<UnchainedHandler>(UnchainedHandler);
                unchainedHandler.initialize(true);

                const lastBlock = { data: { id: "123", height: 443, timestamp: 111112 } };
                const block = {
                    data: {
                        id: "987",
                        height: lastBlock.data.height + 2,
                        timestamp: 111122,
                        generatorPublicKey: "03ea97a59522c4cb4bb3420fc94555f6223813d9817dd421bf533b390a7ea140db",
                    },
                };
                blockchain.getLastBlock = jest.fn().mockReturnValue(lastBlock);
                blockchain.getQueue = jest.fn().mockReturnValue({ size: jest.fn().mockReturnValueOnce(1) });

                expect(await unchainedHandler.execute(block as Interfaces.IBlock)).toBe(BlockProcessorResult.Rejected);
            });
        });

        describe("when block is already in blockchain (height < last height)", () => {
            it("should return DiscardedButCanBeBroadcasted", async () => {
                const unchainedHandler = sandbox.app.resolve<UnchainedHandler>(UnchainedHandler);

                const lastBlock = { data: { id: "123", height: 443, timestamp: 111112 } };
                const block = {
                    data: {
                        id: "987",
                        height: 442,
                        timestamp: 111102,
                        generatorPublicKey: "03ea97a59522c4cb4bb3420fc94555f6223813d9817dd421bf533b390a7ea140db",
                    },
                };
                blockchain.getLastBlock = jest.fn().mockReturnValueOnce(lastBlock);

                const result = await unchainedHandler.execute(block as Interfaces.IBlock);

                expect(result).toBe(BlockProcessorResult.DiscardedButCanBeBroadcasted);
            });
        });

        describe("when it is a GeneratorMismatch case", () => {
            it("should return Rejected", async () => {
                const unchainedHandler = sandbox.app.resolve<UnchainedHandler>(UnchainedHandler);

                const lastBlock = { data: { id: "123", height: 443, timestamp: 111112 } };
                const block = {
                    data: {
                        id: "987",
                        height: 443,
                        timestamp: 111122,
                        generatorPublicKey: "03ea97a59522c4cb4bb3420fc94555f6223813d9817dd421bf533b390a7ea140db",
                    },
                };
                blockchain.getLastBlock = jest.fn().mockReturnValueOnce(lastBlock);

                const result = await unchainedHandler.execute(block as Interfaces.IBlock);

                expect(result).toBe(BlockProcessorResult.Rejected);
            });
        });

        describe("when it is a InvalidTimestamp case", () => {
            it("should return Rejected", async () => {
                const unchainedHandler = sandbox.app.resolve<UnchainedHandler>(UnchainedHandler);

                const lastBlock = { data: { id: "123", height: 443, timestamp: 111112 } };
                const block = {
                    data: {
                        id: "987",
                        height: lastBlock.data.height + 1,
                        timestamp: lastBlock.data.timestamp - 20,
                        generatorPublicKey: "03ea97a59522c4cb4bb3420fc94555f6223813d9817dd421bf533b390a7ea140db",
                    },
                };
                blockchain.getLastBlock = jest.fn().mockReturnValueOnce(lastBlock);

                const result = await unchainedHandler.execute(block as Interfaces.IBlock);

                expect(result).toBe(BlockProcessorResult.Rejected);
            });
        });

        it("should return DiscardedButCanBeBroadcasted when does not match above cases", async () => {
            const unchainedHandler = sandbox.app.resolve<UnchainedHandler>(UnchainedHandler);

            const lastBlock = { data: { id: "123", height: 443, timestamp: 111112 } };
            const block = lastBlock;
            blockchain.getLastBlock = jest.fn().mockReturnValueOnce(lastBlock);
            const result = await unchainedHandler.execute(block as Interfaces.IBlock);

            expect(result).toBe(BlockProcessorResult.DiscardedButCanBeBroadcasted);
        });
    });
});
