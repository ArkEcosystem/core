import { Blocks, CryptoSuite } from "@arkecosystem/core-crypto";
import { Container } from "@arkecosystem/core-kernel";
import { MissingCommonBlockError } from "@arkecosystem/core-p2p/src/errors";
import { Peer } from "@arkecosystem/core-p2p/src/peer";
import { PeerController } from "@arkecosystem/core-p2p/src/socket-server/controllers/peer";
import { TooManyTransactionsError, UnchainedBlockError } from "@arkecosystem/core-p2p/src/socket-server/errors";
import { getPeerConfig } from "@arkecosystem/core-p2p/src/socket-server/utils/get-peer-config";
import { Networks } from "@arkecosystem/crypto";

describe("PeerController", () => {
    let peerController: PeerController;

    const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));
    crypto.CryptoManager.MilestoneManager.getMilestone().aip11 = true; // for creating aip11 v2 transactions

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
        [Container.Identifiers.CryptoManager]: crypto.CryptoManager,
        [Container.Identifiers.BlockFactory]: crypto.BlockFactory,
        [Container.Identifiers.TransactionManager]: crypto.TransactionManager,
    };
    const config = { getOptional: jest.fn().mockReturnValue(["127.0.0.1"]) }; // remoteAccess
    const app = {
        get: (key) => appGet[key],
        getTagged: () => config,
        version: () => "3.0.9",
        resolve: () => ({
            from: () => ({
                merge: () => ({
                    all: () => ({ server: { http: { port: "4003" } } }),
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
        container.bind(Container.Identifiers.CryptoManager).toConstantValue(crypto.CryptoManager);
        container.bind(Container.Identifiers.BlockFactory).toConstantValue(crypto.BlockFactory);
        container.bind(Container.Identifiers.TransactionManager).toConstantValue(crypto.TransactionManager);
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
        it("should return the first common block found and the last height", async () => {
            const request = { payload: { ids: ["123456789", "111116789"] } };
            database.getCommonBlocks = jest.fn().mockReturnValueOnce(request.payload.ids);
            const height = 1433;
            blockchain.getLastBlock = jest.fn().mockReturnValueOnce({ data: { height } });
            const commonBlocks = await peerController.getCommonBlocks(request, {});

            expect(commonBlocks).toEqual({
                common: request.payload.ids[0],
                lastBlockHeight: height,
            });
        });

        it("should throw MissingCommonBlockError when no common block found", async () => {
            const request = { payload: { ids: ["123456789", "111116789"] } };
            database.getCommonBlocks = jest.fn().mockReturnValueOnce([]);

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
            jest.spyOn(crypto.CryptoManager.LibraryManager.Crypto.Slots, "getSlotInfo").mockReturnValueOnce(slotInfo);

            const status = await peerController.getStatus({}, {});

            expect(status).toEqual({
                state: {
                    height,
                    forgingAllowed: slotInfo.forgingStatus,
                    currentSlot: slotInfo.slotNumber,
                    header,
                },
                config: getPeerConfig(app as any, crypto.CryptoManager),
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
            jest.spyOn(crypto.CryptoManager.LibraryManager.Crypto.Slots, "getSlotInfo").mockReturnValueOnce(slotInfo);

            const status = await peerController.getStatus({}, {});

            expect(status).toEqual({
                state: {
                    height: 0,
                    forgingAllowed: false,
                    currentSlot: 0,
                    header: {},
                },
                config: getPeerConfig(app as any, crypto.CryptoManager),
            });
        });
    });

    describe("postBlock", () => {
        const block = {
            data: {
                id: "3863292773792902701",
                version: 0,
                timestamp: 46583330,
                height: 2,
                reward: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("0"),
                previousBlock: "17184958558311101492",
                numberOfTransactions: 1,
                totalAmount: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("0"),
                totalFee: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("0"),
                payloadLength: 0,
                payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                generatorPublicKey: "026c598170201caf0357f202ff14f365a3b09322071e347873869f58d776bfc565",
                blockSignature:
                    "3045022100e7385c6ea42bd950f7f6ab8c8619cf2f66a41d8f8f185b0bc99af032cb25f30d02200b6210176a6cedfdcbe483167fd91c21d740e0e4011d24d679c601fdd46b0de9",
            },
            transactions: [
                crypto.TransactionManager.BuilderFactory.transfer()
                    .amount("100")
                    .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase("recipient's secret"))
                    .fee("100")
                    .sign("sender's secret")
                    .build(),
            ],
        } as Blocks.Block;
        const deepClone = (obj: Blocks.Block) => {
            // @ts-ignore
            obj.transactions.forEach((transaction) => delete transaction.transactionTools);
            const newObj = JSON.parse(JSON.stringify(obj));
            obj.transactions.forEach(
                // @ts-ignore
                (transaction) => (transaction.transactionTools = crypto.TransactionManager.TransactionTools),
            );
            return newObj;
        };

        describe("when block contains too many transactions", () => {
            it("should throw TooManyTransactionsError when numberOfTransactions is too much", async () => {
                const blockTooManyTxs = deepClone(block);
                blockTooManyTxs.data.numberOfTransactions = 350;
                const blockSerialized = crypto.BlockFactory.serializer.serializeWithTransactions({
                    ...blockTooManyTxs.data,
                    transactions: blockTooManyTxs.transactions.map((tx) => tx.data),
                });

                await expect(
                    peerController.postBlock({ payload: { block: { data: blockSerialized } } }, {}),
                ).rejects.toBeInstanceOf(TooManyTransactionsError);
            });

            it("should throw TooManyTransactionsError when transactions.length is too much", async () => {
                blockchain.getLastDownloadedBlock = jest.fn().mockReturnValueOnce(Networks.testnet.genesisBlock);
                const blockTooManyTxs = deepClone(block);

                const transactions = [];
                for (let i = 0; i < 2; i++) {
                    transactions.push(
                        crypto.TransactionManager.BuilderFactory.transfer()
                            .version(2)
                            .amount("100")
                            .recipientId(
                                crypto.CryptoManager.Identities.Address.fromPassphrase(`recipient secret ${i}`),
                            )
                            .fee("100")
                            .nonce(`${i + 1}`)
                            .sign(`sender secret ${i}`)
                            .build(),
                    );
                }
                blockTooManyTxs.transactions = transactions;
                blockTooManyTxs.data.numberOfTransactions = 2;

                const blockSerialized = crypto.BlockFactory.serializer.serializeWithTransactions({
                    ...blockTooManyTxs.data,
                    transactions: transactions.map((tx) => tx.data),
                });

                // this is a trick to make the first numberOfTransactions check pass
                // but then transactions.length fail
                // probably some unreachable code though...
                // @ts-ignore
                const milestone = peerController.cryptoManager.MilestoneManager.getMilestone();
                // @ts-ignore
                const spyGetMilestone = jest.spyOn(peerController.cryptoManager.MilestoneManager, "getMilestone");

                spyGetMilestone.mockReturnValue({
                    ...milestone,
                    block: {
                        maxTransactions: 1,
                    },
                });

                await expect(
                    peerController.postBlock(
                        {
                            payload: { block: { data: blockSerialized } },
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
                    const blockSerialized = crypto.BlockFactory.serializer.serializeWithTransactions({
                        ...blockUnchained.data,
                        transactions: blockUnchained.transactions.map((tx) => tx.data),
                    });

                    if (blockPing) {
                        blockchain.pingBlock = jest.fn().mockReturnValueOnce(true);
                        await expect(
                            peerController.postBlock(
                                {
                                    payload: { block: { data: blockSerialized } },
                                    info: { remoteAddress: "187.55.33.22" },
                                },
                                {},
                            ),
                        ).toResolve();
                        expect(blockchain.handleIncomingBlock).toBeCalledTimes(0);
                    } else {
                        await expect(
                            peerController.postBlock(
                                {
                                    payload: { block: { data: blockSerialized } },
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

                const blockSerialized = crypto.BlockFactory.serializer.serializeWithTransactions({
                    ...block.data,
                    transactions: block.transactions.map((tx) => tx.data),
                });
                await peerController.postBlock(
                    {
                        payload: { block: { data: blockSerialized } },
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

                const blockSerialized = crypto.BlockFactory.serializer.serializeWithTransactions({
                    ...block.data,
                    transactions: block.transactions.map((tx) => tx.data),
                });
                await peerController.postBlock(
                    {
                        payload: { block: { data: blockSerialized } },
                        info: { remoteAddress: ip },
                    },
                    {},
                );

                expect(blockchain.handleIncomingBlock).toBeCalledTimes(1);
                expect(blockchain.handleIncomingBlock).toBeCalledWith(expect.objectContaining(block.data), false);
            });
        });
    });

    describe("postTransactions", () => {
        it("should create transaction processor and use it to process the transactions", async () => {
            const transactions = Networks.testnet.genesisBlock.transactions;
            const processor = { process: jest.fn(), accept: [transactions[0].id] };
            createProcessor.mockReturnValueOnce(processor);

            expect(await peerController.postTransactions({ payload: { transactions } }, {})).toEqual([
                transactions[0].id,
            ]);

            expect(processor.process).toBeCalledTimes(1);
            expect(processor.process).toBeCalledWith(transactions);
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

            const blocks = await peerController.getBlocks({ payload, info: { remoteAddress: ip } }, {});

            expect(blocks).toEqual(mockBlocks);
            expect(database.getBlocksForDownload).toBeCalledTimes(1);
            expect(database.getBlocksForDownload).toBeCalledWith(
                payload.lastBlockHeight + 1,
                payload.blockLimit,
                payload.headersOnly,
            );
        });
    });
});
