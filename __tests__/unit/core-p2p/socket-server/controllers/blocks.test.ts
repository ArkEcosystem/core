import { Container } from "@arkecosystem/core-kernel";
import { BlocksController } from "@arkecosystem/core-p2p/src/socket-server/controllers/blocks";
import { TooManyTransactionsError, UnchainedBlockError } from "@arkecosystem/core-p2p/src/socket-server/errors";
import { Blocks, Identities, Managers, Networks, Transactions, Utils, Interfaces } from "@arkecosystem/crypto";

Managers.configManager.getMilestone().aip11 = true; // for creating aip11 v2 transactions

describe("BlocksController", () => {
    let blocksController: BlocksController;

    const container = new Container.Container();

    const logger = { warning: jest.fn(), debug: jest.fn(), info: jest.fn() };
    const peerStorage = { getPeers: jest.fn() };
    const database = { getCommonBlocks: jest.fn(), getBlocksForDownload: jest.fn() };
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
        container.bind(Container.Identifiers.Application).toConstantValue(app);
    });

    beforeEach(() => {
        blocksController = container.resolve<BlocksController>(BlocksController);
    });

    describe("postBlock", () => {
        const block = {
            data: {
                id: "3863292773792902701",
                version: 0,
                timestamp: 46583330,
                height: 2,
                reward: Utils.BigNumber.make("0"),
                previousBlock: "17184958558311101492",
                numberOfTransactions: 1,
                totalAmount: Utils.BigNumber.make("0"),
                totalFee: Utils.BigNumber.make("0"),
                payloadLength: 0,
                payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                generatorPublicKey: "026c598170201caf0357f202ff14f365a3b09322071e347873869f58d776bfc565",
                blockSignature:
                    "3045022100e7385c6ea42bd950f7f6ab8c8619cf2f66a41d8f8f185b0bc99af032cb25f30d02200b6210176a6cedfdcbe483167fd91c21d740e0e4011d24d679c601fdd46b0de9",
            },
            transactions: [
                Transactions.BuilderFactory.transfer()
                    .amount("100")
                    .recipientId(Identities.Address.fromPassphrase("recipient's secret"))
                    .fee("100")
                    .sign("sender's secret")
                    .build(),
            ],
        } as Blocks.Block;
        const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

        describe("when block contains too many transactions", () => {
            it("should throw TooManyTransactionsError when numberOfTransactions is too much", async () => {
                const blockTooManyTxs = deepClone(block);
                blockTooManyTxs.data.numberOfTransactions = 350;
                const blockSerialized = Blocks.Serializer.serializeWithTransactions({
                    ...blockTooManyTxs.data,
                    transactions: blockTooManyTxs.transactions.map((tx) => tx.data),
                });

                await expect(
                    blocksController.postBlock({ payload: { block: blockSerialized } }, {}),
                ).rejects.toBeInstanceOf(TooManyTransactionsError);
            });

            it("should throw TooManyTransactionsError when transactions.length is too much", async () => {
                blockchain.getLastDownloadedBlock = jest.fn().mockReturnValueOnce(Networks.testnet.genesisBlock);
                const blockTooManyTxs = deepClone(block);

                const transactions: Interfaces.ITransaction[] = [];
                for (let i = 0; i < 2; i++) {
                    transactions.push(
                        Transactions.BuilderFactory.transfer()
                            .version(2)
                            .amount("100")
                            .recipientId(Identities.Address.fromPassphrase(`recipient secret ${i}`))
                            .fee("100")
                            .nonce(`${i + 1}`)
                            .sign(`sender secret ${i}`)
                            .build(),
                    );
                }
                blockTooManyTxs.transactions = transactions;
                blockTooManyTxs.data.numberOfTransactions = 2;

                const blockSerialized = Blocks.Serializer.serializeWithTransactions({
                    ...blockTooManyTxs.data,
                    transactions: transactions.map((tx) => tx.data),
                });

                // this is a trick to make the first numberOfTransactions check pass
                // but then transactions.length fail
                // probably some unreachable code though...
                const milestone = Managers.configManager.getMilestone();
                const spyGetMilestone = jest.spyOn(Managers.configManager, "getMilestone");
                for (let i = 0; i < 87; i++) {
                    // yeah 87 times :wtf: before the one we are interested to mock kicks in
                    spyGetMilestone.mockReturnValueOnce({
                        ...milestone,
                        block: {
                            maxTransactions: 150,
                        },
                    });
                }
                spyGetMilestone.mockReturnValueOnce({
                    ...milestone,
                    block: {
                        maxTransactions: 1,
                    },
                });


                await expect(
                    blocksController.postBlock(
                        {
                            payload: { block: blockSerialized },
                            info: { remoteAddress: "187.55.33.22" },
                        },
                        {},
                    ),
                ).rejects.toBeInstanceOf(TooManyTransactionsError);

                spyGetMilestone.mockRestore();
            });
        });

        describe("when block is not chained", () => {
            it.each([[true], [false]])(
                "should throw UnchainedBlockError only if block is not known",
                async (blockPing) => {
                    blockchain.getLastDownloadedBlock = jest.fn().mockReturnValueOnce(Networks.testnet.genesisBlock);
                    const blockUnchained = deepClone(block);
                    blockUnchained.data.height = 9;
                    const blockSerialized = Blocks.Serializer.serializeWithTransactions({
                        ...blockUnchained.data,
                        transactions: blockUnchained.transactions.map((tx) => tx.data),
                    });

                    if (blockPing) {
                        blockchain.pingBlock = jest.fn().mockReturnValueOnce(true);
                        await expect(
                            blocksController.postBlock(
                                {
                                    payload: { block: blockSerialized },
                                    info: { remoteAddress: "187.55.33.22" },
                                },
                                {},
                            ),
                        ).toResolve();
                        expect(blockchain.handleIncomingBlock).toBeCalledTimes(0);
                    } else {
                        await expect(
                            blocksController.postBlock(
                                {
                                    payload: { block: blockSerialized },
                                    info: { remoteAddress: "187.55.33.22" },
                                },
                                {},
                            ),
                        ).rejects.toBeInstanceOf(UnchainedBlockError);
                    }
                },
            );
        });

        describe("when block comes from forger", () => {
            it("should call handleIncomingBlock with the block and fromForger=true", async () => {
                blockchain.handleIncomingBlock = jest.fn();
                const ip = "187.55.33.22";
                config.getOptional.mockReturnValueOnce([ip]);

                const blockSerialized = Blocks.Serializer.serializeWithTransactions({
                    ...block.data,
                    transactions: block.transactions.map((tx) => tx.data),
                });
                await blocksController.postBlock(
                    {
                        payload: { block: blockSerialized },
                        info: { remoteAddress: ip },
                    },
                    {},
                );

                expect(blockchain.handleIncomingBlock).toBeCalledTimes(1);
                expect(blockchain.handleIncomingBlock).toBeCalledWith(expect.objectContaining(block.data), true);
            });
        });

        describe("when block does not come from forger", () => {
            it("should call handleIncomingBlock with the block and fromForger=false", async () => {
                blockchain.getLastDownloadedBlock = jest.fn().mockReturnValueOnce(Networks.testnet.genesisBlock);
                blockchain.handleIncomingBlock = jest.fn();
                const ip = "187.55.33.22";
                config.getOptional.mockReturnValueOnce(["188.66.55.44"]);

                const blockSerialized = Blocks.Serializer.serializeWithTransactions({
                    ...block.data,
                    transactions: block.transactions.map((tx) => tx.data),
                });
                await blocksController.postBlock(
                    {
                        payload: { block: blockSerialized },
                        info: { remoteAddress: ip },
                    },
                    {},
                );

                expect(blockchain.handleIncomingBlock).toBeCalledTimes(1);
                expect(blockchain.handleIncomingBlock).toBeCalledWith(expect.objectContaining(block.data), false);
            });
        });
    });

    describe("getBlocks", () => {
        it("should use database.getBlocksForDownload to get the blocks according to the request params", async () => {
            // request parameters: lastBlockHeight, blockLimit, headersOnly
            const mockBlocks = [Networks.testnet.genesisBlock];
            database.getBlocksForDownload = jest.fn().mockReturnValueOnce(mockBlocks);
            const payload = {
                lastBlockHeight: 1,
                blockLimit: 100,
                headersOnly: true,
            };
            const ip = "187.55.33.22";

            const blocks = await blocksController.getBlocks({ payload, info: { remoteAddress: ip } }, {});

            expect(blocks).toEqual(mockBlocks);
            expect(database.getBlocksForDownload).toBeCalledTimes(1);
            expect(database.getBlocksForDownload).toBeCalledWith(
                payload.lastBlockHeight + 1,
                payload.blockLimit,
                payload.headersOnly,
            );
        });

        it("should use database.getBlocksForDownload to get the blocks according to the request params with default block limit", async () => {
            // request parameters: lastBlockHeight, blockLimit, headersOnly
            const mockBlocks = [Networks.testnet.genesisBlock];
            database.getBlocksForDownload = jest.fn().mockReturnValueOnce(mockBlocks);
            const payload = {
                lastBlockHeight: 1,
                blockLimit: null,
                headersOnly: true,
            };
            const ip = "187.55.33.22";

            const blocks = await blocksController.getBlocks({ payload, info: { remoteAddress: ip } }, {});

            expect(blocks).toEqual(mockBlocks);
            expect(database.getBlocksForDownload).toBeCalledTimes(1);
            expect(database.getBlocksForDownload).toBeCalledWith(
                payload.lastBlockHeight + 1,
                400,
                payload.headersOnly,
            );
        });
    });
});
