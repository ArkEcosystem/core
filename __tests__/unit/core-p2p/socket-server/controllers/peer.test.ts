import { Crypto, Blocks, Utils, Networks } from "@arkecosystem/crypto";
import { Container } from "@arkecosystem/core-kernel";

import { PeerController } from "@arkecosystem/core-p2p/src/socket-server/controllers/peer";
import { Peer } from "@arkecosystem/core-p2p/src/peer";
import { MissingCommonBlockError } from "@arkecosystem/core-p2p/src/errors";
import { getPeerConfig } from "@arkecosystem/core-p2p/src/socket-server/utils/get-peer-config";
import { TooManyTransactionsError, UnchainedBlockError } from "@arkecosystem/core-p2p/src/socket-server/errors";

describe("PeerController", () => {
    let peerController: PeerController;

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
    const appGet = {
        [Container.Identifiers.BlockchainService]: blockchain,
        [Container.Identifiers.TransactionPoolProcessorFactory]: createProcessor,
    }
    const config = { getOptional: jest.fn().mockReturnValue(["127.0.0.1"]) }; // remoteAccess
    const app = {
        get: (key) => appGet[key],
        getTagged: () => config,
        version: () => "3.0.9",
    };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.PeerStorage).toConstantValue(peerStorage);
        container.bind(Container.Identifiers.DatabaseService).toConstantValue(database);
        container.bind(Container.Identifiers.Application).toConstantValue(app);
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
                [peers[2], peers[1], peers[0], peers[3], peers[4]].map(p => p.toBroadcast())
            );
        })
    });

    describe("getCommonBlocks", () => {
        it("should return the first common block found and the last height", async () => {
            const request = { payload: { ids: ["123456789", "111116789"] }};
            database.getCommonBlocks = jest.fn().mockReturnValueOnce(request.payload.ids);
            const height = 1433;
            blockchain.getLastBlock = jest.fn().mockReturnValueOnce({ data: { height }});
            const commonBlocks = await peerController.getCommonBlocks(request, {});

            expect(commonBlocks).toEqual({
                common: request.payload.ids[0],
                lastBlockHeight: height
            })
        })

        it("should throw MissingCommonBlockError when no common block found", async () => {
            const request = { payload: { ids: ["123456789", "111116789"] }};
            database.getCommonBlocks = jest.fn().mockReturnValueOnce([]);

            await expect(peerController.getCommonBlocks(request, {})).rejects.toBeInstanceOf(MissingCommonBlockError);
        })
    });

    describe("getStatus", () => {
        it("should return the status based on last block", async () => {
            const header = { id: "984003423092345907" };
            const height = 1987;
            const lastBlock = {
                data: { height },
                getHeader: () => header,
            }
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

            expect(status).toEqual({
                state: {
                    height,
                    forgingAllowed: slotInfo.forgingStatus,
                    currentSlot: slotInfo.slotNumber,
                    header,
                },
                config: getPeerConfig(app as any),
            });
        })

        it("should return height=0 and header={} when no last block found", async () => {
            blockchain.getLastBlock = jest.fn();
            const slotInfo = {
                forgingStatus: true,
                slotNumber: 344,
                startTime: 98700,
                endTime: 99000,
                blockTime: 8,
            };
            jest.spyOn(Crypto.Slots, "getSlotInfo").mockReturnValueOnce(slotInfo);

            const status = await peerController.getStatus({}, {});

            expect(status).toEqual({
                state: {
                    height: 0,
                    forgingAllowed: false,
                    currentSlot: 0,
                    header: {},
                },
                config: getPeerConfig(app as any),
            });
        })
    });

    describe("postBlock", () => {
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
        const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

        describe("when block contains too many transactions", () => {
            it("should throw TooManyTransactionsError", async () => {
                const blockTooManyTxs = deepClone(block);
                blockTooManyTxs.data.numberOfTransactions = 350;
                const blockSerialized = Blocks.Serializer.serializeWithTransactions(blockTooManyTxs.data);

                await expect(
                    peerController.postBlock({ payload: { block: { data: blockSerialized }}}, {})
                ).rejects.toBeInstanceOf(TooManyTransactionsError);
            })
        })

        describe("when block is not chained", () => {
            it("should throw UnchainedBlockError", async () => {
                blockchain.getLastDownloadedBlock = jest.fn().mockReturnValueOnce(Networks.testnet.genesisBlock);
                const blockUnchained = deepClone(block);
                blockUnchained.data.height = 9;
                const blockSerialized = Blocks.Serializer.serializeWithTransactions(blockUnchained.data);

                await expect(
                    peerController.postBlock({
                        payload: { block: { data: blockSerialized } },
                        info: { remoteAddress: "187.55.33.22" }
                    }, {})
                ).rejects.toBeInstanceOf(UnchainedBlockError);
            })
        })


        describe("when block comes from forger", () => {
            it("should call handleIncomingBlock with the block and fromForger=true", async () => {
                blockchain.handleIncomingBlock = jest.fn();
                const ip = "187.55.33.22";
                config.getOptional.mockReturnValueOnce([ip]);

                const blockSerialized = Blocks.Serializer.serializeWithTransactions(block.data);
                await peerController.postBlock({
                    payload: { block: { data: blockSerialized } },
                    info: { remoteAddress: ip }
                }, {});

                expect(blockchain.handleIncomingBlock).toBeCalledTimes(1);
                expect(blockchain.handleIncomingBlock).toBeCalledWith(
                    expect.objectContaining(block.data),
                    true
                );
            })
        })

        describe("when block does not come from forger", () => {
            it("should call handleIncomingBlock with the block and fromForger=false", async () => {
                blockchain.getLastDownloadedBlock = jest.fn().mockReturnValueOnce(Networks.testnet.genesisBlock);
                blockchain.handleIncomingBlock = jest.fn();
                const ip = "187.55.33.22";
                config.getOptional.mockReturnValueOnce(["188.66.55.44"]);

                const blockSerialized = Blocks.Serializer.serializeWithTransactions(block.data);
                await peerController.postBlock({
                    payload: { block: { data: blockSerialized } },
                    info: { remoteAddress: ip }
                }, {});

                expect(blockchain.handleIncomingBlock).toBeCalledTimes(1);
                expect(blockchain.handleIncomingBlock).toBeCalledWith(
                    expect.objectContaining(block.data),
                    false
                );
            })

        })
    });

    describe("postTransactions", () => {
        it("should create transaction processor and use it to process the transactions", async () => {
            const transactions = Networks.testnet.genesisBlock.transactions;
            const processor = { process: jest.fn(), accept: [ transactions[0].id ] };
            createProcessor.mockReturnValueOnce(processor);

            expect(
                await peerController.postTransactions({ payload: { transactions }}, {})
            ).toEqual([ transactions[0].id ]);

            expect(processor.process).toBeCalledTimes(1);
            expect(processor.process).toBeCalledWith(transactions);
        })
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
                payload.headersOnly
            );
        })
    });
});
