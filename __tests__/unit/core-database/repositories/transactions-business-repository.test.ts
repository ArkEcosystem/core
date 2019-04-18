import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { Enums } from "@arkecosystem/crypto";
import { TransactionsBusinessRepository } from "../../../../packages/core-database/src/repositories/transactions-business-repository";
import { DatabaseConnectionStub } from "../__fixtures__/database-connection-stub";
import { MockDatabaseModel } from "../__fixtures__/mock-database-model";

describe("Transactions Business Repository", () => {
    let transactionsBusinessRepository: Database.ITransactionsBusinessRepository;
    let databaseService: Database.IDatabaseService;

    beforeEach(() => {
        transactionsBusinessRepository = new TransactionsBusinessRepository(() => databaseService);
        databaseService = {
            connection: new DatabaseConnectionStub(),
        } as Database.IDatabaseService;
    });

    describe("search", () => {
        it("should invoke search on db repository", async () => {
            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel(),
            } as any;

            jest.spyOn(databaseService.connection.transactionsRepository, "search").mockImplementation(async () => ({
                rows: [],
                count: 0,
            }));

            await transactionsBusinessRepository.search(
                {
                    id: "id",
                    offset: 10,
                    limit: 1000,
                    orderBy: "id:asc",
                },
                "asc",
            );

            expect(databaseService.connection.transactionsRepository.search).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: [
                        {
                            field: "id",
                            operator: expect.anything(),
                            value: "id",
                        },
                    ],
                    paginate: {
                        offset: 10,
                        limit: 1000,
                    },
                    orderBy: expect.arrayContaining([
                        {
                            field: "id",
                            direction: "asc",
                        },
                        {
                            field: "sequence",
                            direction: "asc",
                        },
                    ]),
                }),
            );
        });

        it("should return no rows if exception thrown", async () => {
            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel(),
            } as any;
            jest.spyOn(databaseService.connection.transactionsRepository, "search").mockImplementation(async () => {
                throw new Error("bollocks");
            });

            const result = await transactionsBusinessRepository.search({});

            expect(databaseService.connection.transactionsRepository.search).toHaveBeenCalled();
            expect(result.rows).toHaveLength(0);
            expect(result.count).toEqual(0);
        });

        it("should return no rows if senderId is an invalid address", async () => {
            databaseService.walletManager = {
                exists: addressOrPublicKey => false,
            } as Database.IWalletManager;
            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel(),
            } as any;

            const result = await transactionsBusinessRepository.search({
                senderId: "some invalid address",
            });

            expect(result.rows).toHaveLength(0);
            expect(result.count).toEqual(0);
        });

        it("should lookup senders address from senderId", async () => {
            databaseService.walletManager = {
                exists: addressOrPublicKey => true,
                findByAddress: address => ({ publicKey: "pubKey" }),
            } as Database.IWalletManager;

            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel(),
            } as any;

            jest.spyOn(databaseService.connection.transactionsRepository, "search").mockImplementation(async () => ({
                rows: [],
                count: 0,
            }));

            await transactionsBusinessRepository.search({
                senderId: "some invalid address",
            });

            expect(databaseService.connection.transactionsRepository.search).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: [
                        {
                            field: "senderPublicKey",
                            operator: expect.anything(),
                            value: "pubKey",
                        },
                    ],
                }),
            );
        });

        it("should lookup ownerIds wallet when searching", async () => {
            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel(),
            } as any;

            jest.spyOn(databaseService.connection.transactionsRepository, "search").mockImplementation(async () => ({
                rows: [],
                count: 0,
            }));

            const expectedWallet = {};
            databaseService.walletManager = {
                findByAddress: address => expectedWallet,
            } as Database.IWalletManager;

            await transactionsBusinessRepository.search({
                ownerId: "ownerId",
            });

            expect(databaseService.connection.transactionsRepository.search).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: [
                        {
                            field: "ownerWallet",
                            operator: expect.anything(),
                            value: expectedWallet,
                        },
                    ],
                }),
            );
        });

        it("should set recipientId=addresses if former not supplied", async () => {
            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel(),
            } as any;

            jest.spyOn(databaseService.connection.transactionsRepository, "search").mockImplementation(async () => ({
                rows: [],
                count: 0,
            }));

            const addressList = ["addy1", "addy2"];
            const params = {
                addresses: addressList,
                senderPublicKey: "pubKey",
            };
            await transactionsBusinessRepository.search(params);

            expect(databaseService.connection.transactionsRepository.search).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: expect.arrayContaining([
                        {
                            field: "recipientId",
                            operator: expect.anything(),
                            value: addressList,
                        },
                        {
                            field: "senderPublicKey",
                            operator: expect.anything(),
                            value: "pubKey",
                        },
                    ]),
                }),
            );
        });

        it("should set senderPublicKey=addresses if former not supplied", async () => {
            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel(),
            } as any;

            jest.spyOn(databaseService.connection.transactionsRepository, "search").mockImplementation(async () => ({
                rows: [],
                count: 0,
            }));

            databaseService.walletManager = {
                exists: addressOrPublicKey => false,
            } as Database.IWalletManager;

            jest.spyOn(databaseService.walletManager, "exists").mockReturnValue(false);

            await transactionsBusinessRepository.search({
                addresses: ["addy1", "addy2"],
                recipientId: "someId",
            });

            expect(databaseService.connection.transactionsRepository.search).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: expect.arrayContaining([
                        {
                            field: "recipientId",
                            operator: expect.anything(),
                            value: "someId",
                        },
                        {
                            field: "senderPublicKey",
                            operator: expect.anything(),
                            value: expect.anything(),
                        },
                    ]),
                }),
            );
            expect(databaseService.walletManager.exists).toHaveBeenNthCalledWith(1, "addy1");
            expect(databaseService.walletManager.exists).toHaveBeenNthCalledWith(2, "addy2");
        });

        it("should cache blocks if cache-miss ", async () => {
            const expectedBlockId = 1;
            const expectedHeight = 100;

            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel(),
            } as any;

            jest.spyOn(databaseService.connection.transactionsRepository, "search").mockImplementation(
                async () =>
                    ({
                        rows: [
                            {
                                blockId: expectedBlockId,
                            },
                        ],
                        count: 0,
                    } as any),
            );

            databaseService.connection.blocksRepository = {
                findByIds: async id => [{}],
            } as Database.IBlocksRepository;

            jest.spyOn(databaseService.connection.blocksRepository, "findByIds").mockImplementation(
                async () =>
                    [
                        {
                            id: expectedBlockId,
                            height: expectedHeight,
                        },
                    ] as any,
            );

            databaseService.cache = new Map();
            jest.spyOn(databaseService.cache, "set").mockReturnThis();

            await transactionsBusinessRepository.search({});

            expect(databaseService.connection.blocksRepository.findByIds).toHaveBeenCalled();
            expect(databaseService.cache.set).toHaveBeenCalledWith(`heights:${expectedBlockId}`, expectedHeight);
        });

        it("should not cache blocks if cache-hit", async () => {
            const expectedBlockId = 1;
            const expectedHeight = 100;
            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel(),
            } as any;

            jest.spyOn(databaseService.connection.transactionsRepository, "search").mockImplementation(
                async () =>
                    ({
                        rows: [
                            {
                                blockId: expectedBlockId,
                            },
                        ],
                        count: 1,
                    } as any),
            );

            databaseService.connection.blocksRepository = {
                findByIds: async id => [{}],
            } as Database.IBlocksRepository;

            jest.spyOn(databaseService.connection.blocksRepository, "findByIds").mockImplementation(
                async () => ({} as any),
            );

            databaseService.cache = new Map();
            jest.spyOn(databaseService.cache, "get").mockReturnValue(expectedHeight);

            const result = await transactionsBusinessRepository.search({});

            expect(databaseService.connection.blocksRepository.findByIds).not.toHaveBeenCalled();
            expect(databaseService.cache.get).toHaveBeenCalledWith(`heights:${expectedBlockId}`);
            expect(result.rows).toHaveLength(1);
            // @ts-ignore
            expect(result.rows[0].block).toEqual({
                id: expectedBlockId,
                height: expectedHeight,
            });
        });
    });

    describe("allVotesBySender", () => {
        it("should search by senderPublicKey and type=vote", async () => {
            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel(),
            } as any;

            jest.spyOn(databaseService.connection.transactionsRepository, "search").mockImplementation(async () => ({
                rows: [],
                count: 0,
            }));

            await transactionsBusinessRepository.allVotesBySender("pubKey");

            expect(databaseService.connection.transactionsRepository.search).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: expect.arrayContaining([
                        {
                            field: "senderPublicKey",
                            operator: expect.anything(),
                            value: "pubKey",
                        },
                        {
                            field: "type",
                            operator: expect.anything(),
                            value: Enums.TransactionTypes.Vote,
                        },
                    ]),
                }),
            );
        });
    });

    describe("findAllByBlock", () => {
        it("should search by blockId", async () => {
            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel(),
            } as any;

            jest.spyOn(databaseService.connection.transactionsRepository, "search").mockImplementation(async () => ({
                rows: [],
                count: 0,
            }));

            await transactionsBusinessRepository.findAllByBlock("blockId");

            expect(databaseService.connection.transactionsRepository.search).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: [
                        {
                            field: "blockId",
                            operator: expect.anything(),
                            value: "blockId",
                        },
                    ],
                    orderBy: [
                        {
                            field: "timestamp",
                            direction: "desc",
                        },
                        {
                            field: "sequence",
                            direction: "asc",
                        },
                    ],
                }),
            );
        });
    });

    describe("findAllByRecipient", () => {
        it("should search by recipientId", async () => {
            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel(),
            } as any;

            jest.spyOn(databaseService.connection.transactionsRepository, "search").mockImplementation(async () => ({
                rows: [],
                count: 0,
            }));

            await transactionsBusinessRepository.findAllByRecipient("recipientId");

            expect(databaseService.connection.transactionsRepository.search).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: [
                        {
                            field: "recipientId",
                            operator: expect.anything(),
                            value: "recipientId",
                        },
                    ],
                }),
            );
        });
    });

    describe("findAllBySender", () => {
        it("should search senderPublicKey", async () => {
            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel(),
            } as any;

            jest.spyOn(databaseService.connection.transactionsRepository, "search").mockImplementation(async () => ({
                rows: [],
                count: 0,
            }));

            await transactionsBusinessRepository.findAllBySender("pubKey");

            expect(databaseService.connection.transactionsRepository.search).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: [
                        {
                            field: "senderPublicKey",
                            operator: expect.anything(),
                            value: "pubKey",
                        },
                    ],
                }),
            );
        });
    });

    describe("findAllByType", () => {
        it("should search transaction type", async () => {
            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel(),
            } as any;

            jest.spyOn(databaseService.connection.transactionsRepository, "search").mockImplementation(async () => ({
                rows: [],
                count: 0,
            }));

            await transactionsBusinessRepository.findAllByType(Enums.TransactionTypes.Transfer);

            expect(databaseService.connection.transactionsRepository.search).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: [
                        {
                            field: "type",
                            operator: expect.anything(),
                            value: Enums.TransactionTypes.Transfer,
                        },
                    ],
                }),
            );
        });
    });

    describe("findAllByWallet", () => {
        it("should search by wallet", async () => {
            databaseService.connection.transactionsRepository = {
                findAllByWallet: async wallet => wallet,
                getModel: () => new MockDatabaseModel(),
            } as any;

            jest.spyOn(databaseService.connection.transactionsRepository, "findAllByWallet").mockImplementation(
                async () => ({ rows: [], count: 0 }),
            );

            await transactionsBusinessRepository.findAllByWallet({} as any);

            expect(databaseService.connection.transactionsRepository.findAllByWallet).toHaveBeenCalled();
        });
    });

    describe("findById", () => {
        it("should invoke findById on db repository", async () => {
            const expectedBlockId = "id";
            const expectedHeight = 100;
            databaseService.connection.transactionsRepository = {
                findById: async id => id,
                getModel: () => new MockDatabaseModel(),
            } as any;

            jest.spyOn(databaseService.connection.transactionsRepository, "findById").mockImplementation(
                async () =>
                    ({
                        blockId: expectedBlockId,
                    } as any),
            );

            databaseService.cache = new Map();
            jest.spyOn(databaseService.cache, "get").mockReturnValue(expectedHeight);

            await transactionsBusinessRepository.findById("id");

            expect(databaseService.connection.transactionsRepository.findById).toHaveBeenCalledWith("id");
        });
    });

    describe("findByTypeAndId", () => {
        it("should search type & id", async () => {
            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel(),
            } as any;
            jest.spyOn(databaseService.connection.transactionsRepository, "search").mockImplementation(async () => ({
                rows: [],
                count: 0,
            }));

            await transactionsBusinessRepository.findByTypeAndId(Enums.TransactionTypes.Transfer, "id");

            expect(databaseService.connection.transactionsRepository.search).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: [
                        {
                            field: "type",
                            operator: expect.anything(),
                            value: Enums.TransactionTypes.Transfer,
                        },
                        {
                            field: "id",
                            operator: expect.anything(),
                            value: "id",
                        },
                    ],
                }),
            );
        });
    });

    describe("getFeeStatistics", () => {
        it("should invoke getFeeStatistics on db repository", async () => {
            databaseService.connection.transactionsRepository = {
                getFeeStatistics: async (days, minFeeBroadcast) => minFeeBroadcast,
                getModel: () => new MockDatabaseModel(),
            } as any;

            jest.spyOn(databaseService.connection.transactionsRepository, "getFeeStatistics").mockImplementation(
                async () => [
                    {
                        type: 0,
                        fee: 1,
                        timestamp: 123,
                    },
                ],
            );

            jest.spyOn(app, "resolveOptions").mockReturnValue({
                dynamicFees: {
                    minFeeBroadcast: 100,
                },
            });

            await transactionsBusinessRepository.getFeeStatistics(7);

            expect(databaseService.connection.transactionsRepository.getFeeStatistics).toHaveBeenCalledWith(7, 100);
        });
    });
});
