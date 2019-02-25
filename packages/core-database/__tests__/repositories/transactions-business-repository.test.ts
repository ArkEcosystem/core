import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { constants } from "@arkecosystem/crypto";
import { TransactionsBusinessRepository } from "../../src/repositories/transactions-business-repository";
import { DatabaseConnectionStub } from "../__fixtures__/database-connection-stub";
import { MockDatabaseModel } from "../__fixtures__/mock-database-model";

describe('Transactions Business Repository', () => {
    let transactionsBusinessRepository: Database.ITransactionsBusinessRepository;
    let databaseService: Database.IDatabaseService;
    beforeEach(() => {
        transactionsBusinessRepository = new TransactionsBusinessRepository(() => databaseService);
        databaseService = {
            connection: new DatabaseConnectionStub()
        } as Database.IDatabaseService;
    });

    describe('findAll', () => {

        it('should invoke findAll on db repository', async () => {
            databaseService.connection.transactionsRepository = {
                findAll: async parameters => parameters,
                getModel: () => new MockDatabaseModel()
            } as Database.ITransactionsRepository;
            jest.spyOn(databaseService.connection.transactionsRepository, "findAll").mockImplementation(async () => ({ rows: [] }));


            await transactionsBusinessRepository.findAll({
                id: "id",
                offset: 10,
                limit: 1000,
                orderBy: "id:asc"
            }, "asc");


            expect(databaseService.connection.transactionsRepository.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: [
                        {
                            field: "id",
                            operator: expect.anything(),
                            value: "id"
                        }
                    ],
                    paginate: {
                        offset: 10,
                        limit: 1000
                    },
                    orderBy: expect.arrayContaining([
                        {
                            field: "id",
                            direction: "asc"
                        },
                        {
                            field: "sequence",
                            direction: "asc"
                        }
                    ])
                })
            )
        });


    });

    describe('allVotesBySender', async () => {

        it('should search by senderPublicKey and type=vote', async () => {

            databaseService.connection.transactionsRepository = {
                findAll: async parameters => parameters,
                getModel: () => new MockDatabaseModel()
            } as Database.ITransactionsRepository;
            jest.spyOn(databaseService.connection.transactionsRepository, "findAll").mockImplementation(async () => ({ rows: [] }));


            await transactionsBusinessRepository.allVotesBySender("pubKey");


            expect(databaseService.connection.transactionsRepository.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: expect.arrayContaining([
                        {
                            field: "senderPublicKey",
                            operator: expect.anything(),
                            value: "pubKey"
                        },
                        {
                            field: "type",
                            operator: expect.anything(),
                            value: constants.TransactionTypes.Vote
                        }
                    ])
                })
            );
        });
    });

    describe('findAllByBlock', () => {

        it('should search by blockId', async () => {

            databaseService.connection.transactionsRepository = {
                findAll: async parameters => parameters,
                getModel: () => new MockDatabaseModel()
            } as Database.ITransactionsRepository;
            jest.spyOn(databaseService.connection.transactionsRepository, "findAll").mockImplementation(async () => ({ rows: [] }));


            await transactionsBusinessRepository.findAllByBlock("blockId");


            expect(databaseService.connection.transactionsRepository.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: [
                        {
                            field: "blockId",
                            operator: expect.anything(),
                            value: "blockId"
                        }
                    ],
                    orderBy: [
                        {
                            field: "sequence",
                            direction: "asc"
                        }
                    ]
                })
            )
        });
    });

    describe('findAllByRecipient', () => {

        it('should search by recipientId', async () => {

            databaseService.connection.transactionsRepository = {
                findAll: async parameters => parameters,
                getModel: () => new MockDatabaseModel()
            } as Database.ITransactionsRepository;
            jest.spyOn(databaseService.connection.transactionsRepository, "findAll").mockImplementation(async () => ({ rows: [] }));


            await transactionsBusinessRepository.findAllByRecipient("recipientId");


            expect(databaseService.connection.transactionsRepository.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: [
                        {
                            field: "recipientId",
                            operator: expect.anything(),
                            value: "recipientId"
                        }
                    ]
                })
            )
        });
    });

    describe('findAllBySender', () => {

        it('should search senderPublicKey', async () => {

            databaseService.connection.transactionsRepository = {
                findAll: async parameters => parameters,
                getModel: () => new MockDatabaseModel()
            } as Database.ITransactionsRepository;
            jest.spyOn(databaseService.connection.transactionsRepository, "findAll").mockImplementation(async () => ({ rows: [] }));


            await transactionsBusinessRepository.findAllBySender("pubKey");


            expect(databaseService.connection.transactionsRepository.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: [
                        {
                            field: "senderPublicKey",
                            operator: expect.anything(),
                            value: "pubKey"
                        }
                    ]
                })
            )
        });
    });


    describe('findAllByType', () => {

        it('should search transaction type', async () => {

            databaseService.connection.transactionsRepository = {
                findAll: async parameters => parameters,
                getModel: () => new MockDatabaseModel()
            } as Database.ITransactionsRepository;
            jest.spyOn(databaseService.connection.transactionsRepository, "findAll").mockImplementation(async () => ({ rows: [] }));


            await transactionsBusinessRepository.findAllByType(constants.TransactionTypes.Transfer);


            expect(databaseService.connection.transactionsRepository.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: [
                        {
                            field: "type",
                            operator: expect.anything(),
                            value: constants.TransactionTypes.Transfer
                        }
                    ]
                })
            )
        });
    });

    describe('findAllByWallet', () => {

        it('should search by wallet', async () => {

            databaseService.connection.transactionsRepository = {
                findAllByWallet: async wallet => wallet,
                getModel: () => new MockDatabaseModel()
            } as Database.ITransactionsRepository;
            jest.spyOn(databaseService.connection.transactionsRepository, "findAllByWallet").mockImplementation(async () => ({ rows: [] }));


            await transactionsBusinessRepository.findAllByWallet({});


            expect(databaseService.connection.transactionsRepository.findAllByWallet).toHaveBeenCalled();
        });
    });

    describe('findById', () => {

        it('should invoke findById on db repository', async () => {

            databaseService.connection.transactionsRepository = {
                findById: async id => id,
                getModel: () => new MockDatabaseModel()
            } as Database.ITransactionsRepository;
            jest.spyOn(databaseService.connection.transactionsRepository, "findById").mockImplementation(async () => true);


            await transactionsBusinessRepository.findById("id");


            expect(databaseService.connection.transactionsRepository.findById).toHaveBeenCalledWith("id");
        });
    });

    describe('findByTypeAndId', () => {

        it('should search type & id', async () => {

            databaseService.connection.transactionsRepository = {
                findAll: async parameters => parameters,
                getModel: () => new MockDatabaseModel()
            } as Database.ITransactionsRepository;
            jest.spyOn(databaseService.connection.transactionsRepository, "findAll").mockImplementation(async () => ({ rows: [] }));


            await transactionsBusinessRepository.findByTypeAndId(constants.TransactionTypes.Transfer, "id");


            expect(databaseService.connection.transactionsRepository.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: [
                        {
                            field: "type",
                            operator: expect.anything(),
                            value: constants.TransactionTypes.Transfer
                        },
                        {
                            field: "id",
                            operator: expect.anything(),
                            value: "id"
                        }
                    ]
                })
            )
        });
    });

    describe('findWithVendorField', () => {

        it('should invoke findWithVendorField on db repository', async () => {

            databaseService.connection.transactionsRepository = {
                findWithVendorField: async () => true,
                getModel: () => new MockDatabaseModel()
            } as Database.ITransactionsRepository;
            jest.spyOn(databaseService.connection.transactionsRepository, "findWithVendorField").mockImplementation(async () => []);


            await transactionsBusinessRepository.findWithVendorField();


            expect(databaseService.connection.transactionsRepository.findWithVendorField).toHaveBeenCalled();
        });
    });

    describe('getFeeStatistics', () => {

        it('should invoke getFeeStatistics on db repository', async () => {

            databaseService.connection.transactionsRepository = {
                getFeeStatistics: async minFeeBroadcast => minFeeBroadcast,
                getModel: () => new MockDatabaseModel()
            } as Database.ITransactionsRepository;
            jest.spyOn(databaseService.connection.transactionsRepository, "getFeeStatistics").mockImplementation(async () => true);
            jest.spyOn(app, "resolveOptions").mockReturnValue({
                dynamicFees: {
                    minFeeBroadcast: 100
                }
            });


            await transactionsBusinessRepository.getFeeStatistics();


            expect(databaseService.connection.transactionsRepository.getFeeStatistics).toHaveBeenCalledWith(100);
        });
    });

    describe('search', () => {

        it('should invoke search on db repository', async () => {

            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel()
            } as Database.ITransactionsRepository;
            jest.spyOn(databaseService.connection.transactionsRepository, "search").mockImplementation(async () => ({ rows: [] }));


            await transactionsBusinessRepository.search({});


            expect(databaseService.connection.transactionsRepository.search).toHaveBeenCalled();
        });

        it('should return no rows if exception thrown', async () => {


            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel()
            } as Database.ITransactionsRepository;
            jest.spyOn(databaseService.connection.transactionsRepository, "search").mockImplementation(async () => {
                throw new Error("bollocks");
            });


            const result = await transactionsBusinessRepository.search({});


            expect(databaseService.connection.transactionsRepository.search).toHaveBeenCalled();
            expect(result.rows).toHaveLength(0);
            expect(result.count).toEqual(0);
        });

        it('should return no rows if senderId is an invalid address', async () => {

            databaseService.walletManager = {
                exists: addressOrPublicKey => false
            } as Database.IWalletManager;
            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel()
            } as Database.ITransactionsRepository;


            const result = await transactionsBusinessRepository.search({
                senderId: "some invalid address"
            });


            expect(result.rows).toHaveLength(0);
            expect(result.count).toEqual(0);
        });

        it('should lookup senders address from senderId', async () => {

            databaseService.walletManager = {
                exists: addressOrPublicKey => true,
                findByAddress: address =>  ({ publicKey: "pubKey" })
            } as Database.IWalletManager;

            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel()
            } as Database.ITransactionsRepository;
            jest.spyOn(databaseService.connection.transactionsRepository, "search").mockImplementation(async () => ({ rows: [] }));


            await transactionsBusinessRepository.search({
                senderId: "some invalid address"
            });


            expect(databaseService.connection.transactionsRepository.search).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: [
                        {
                            field: "senderPublicKey",
                            operator: expect.anything(),
                            value: "pubKey"
                        }
                    ]
                })
            )
        });

        it('should lookup ownerIds wallet when searching', async () => {

            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel()
            } as Database.ITransactionsRepository;
            jest.spyOn(databaseService.connection.transactionsRepository, "search").mockImplementation(async () => ({ rows: [] }));
            const expectedWallet = {};
            databaseService.walletManager = {
                findByAddress: address => expectedWallet
            } as Database.IWalletManager;


            await transactionsBusinessRepository.search({
                ownerId: "ownerId"
            });


            expect(databaseService.connection.transactionsRepository.search).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: [
                        {
                            field: "ownerWallet",
                            operator: expect.anything(),
                            value: expectedWallet
                        }
                    ]
                })
            );
        });

        it('should set recipientId=addresses if former not supplied', async () => {

            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel()
            } as Database.ITransactionsRepository;
            jest.spyOn(databaseService.connection.transactionsRepository, "search").mockImplementation(async () => ({ rows: [] }));


            const addressList = [
                "addy1",
                "addy2"
            ];
            const params = {
                addresses: addressList,
                senderPublicKey: "pubKey"
            };
            await transactionsBusinessRepository.search(params);


            expect(databaseService.connection.transactionsRepository.search).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: expect.arrayContaining([
                        {
                            field: "recipientId",
                            operator: expect.anything(),
                            value: addressList
                        },
                        {
                            field: "senderPublicKey",
                            operator: expect.anything(),
                            value: "pubKey"
                        },
                    ])
                })
            )
        });

        it('should set senderPublicKey=addresses if former not supplied', async () => {

            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel()
            } as Database.ITransactionsRepository;
            jest.spyOn(databaseService.connection.transactionsRepository, "search").mockImplementation(async () => ({ rows: [] }));
            const expectedWallet = {};
            databaseService.walletManager = {
                exists: addressOrPublicKey => false
            } as Database.IWalletManager;
            jest.spyOn(databaseService.walletManager, "exists").mockReturnValue(false);


            await transactionsBusinessRepository.search({
                addresses: [
                    "addy1",
                    "addy2"
                ],
                recipientId: "someId"
            });


            expect(databaseService.connection.transactionsRepository.search).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: expect.arrayContaining([
                        {
                            field: "recipientId",
                            operator: expect.anything(),
                            value: "someId"
                        },
                        {
                            field: "senderPublicKey",
                            operator: expect.anything(),
                            value: expect.anything()
                        }
                    ])
                })
            );
            expect(databaseService.walletManager.exists).toHaveBeenNthCalledWith(1, "addy1");
            expect(databaseService.walletManager.exists).toHaveBeenNthCalledWith(2, "addy2");
        });

        it('should cache blocks if cache-miss ', async () => {

            const expectedBlockId = 1;
            const expectedHeight = 100;
            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel()
            } as Database.ITransactionsRepository;
            jest.spyOn(databaseService.connection.transactionsRepository, "search").mockImplementation(async () => ({
                rows: [
                    {
                        blockId: expectedBlockId
                    }
                ]
            }));
            databaseService.connection.blocksRepository = {
                findByIds: async id => [{}]
            } as Database.IBlocksRepository;
            jest.spyOn(databaseService.connection.blocksRepository, "findByIds").mockImplementation(async () => [
                {
                    id: expectedBlockId,
                    height: expectedHeight
                }
            ]);
            databaseService.cache = new Map();
            jest.spyOn(databaseService.cache, "set").mockReturnThis();


            await transactionsBusinessRepository.search({});


            expect(databaseService.connection.blocksRepository.findByIds).toHaveBeenCalled();
            expect(databaseService.cache.set).toHaveBeenCalledWith(
                `heights:${expectedBlockId}`,
                expectedHeight
            );

        });

        it('should not cache blocks if cache-hit', async () => {

            const expectedBlockId = 1;
            const expectedHeight = 100;
            databaseService.connection.transactionsRepository = {
                search: async parameters => parameters,
                getModel: () => new MockDatabaseModel()
            } as Database.ITransactionsRepository;
            jest.spyOn(databaseService.connection.transactionsRepository, "search").mockImplementation(async () => ({
                rows: [
                    {
                        blockId: expectedBlockId
                    }
                ]
            }));
            databaseService.connection.blocksRepository = {
                findByIds: async id => [{}]
            } as Database.IBlocksRepository;
            jest.spyOn(databaseService.connection.blocksRepository, "findByIds").mockImplementation(async () => [{}]);
            databaseService.cache = new Map();
            jest.spyOn(databaseService.cache, "get").mockReturnValue(expectedHeight);


            const result = await transactionsBusinessRepository.search({});


            expect(databaseService.connection.blocksRepository.findByIds).not.toHaveBeenCalled();
            expect(databaseService.cache.get).toHaveBeenCalledWith(`heights:${expectedBlockId}`);
            expect(result.rows).toHaveLength(1);
            expect(result.rows[0].block).toEqual({
                id: expectedBlockId,
                height: expectedHeight
            })
        });

    });
});
