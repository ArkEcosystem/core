import { Database } from "@arkecosystem/core-interfaces";
import { BlocksBusinessRepository } from "../../src/repositories/blocks-business-repository";
import { DatabaseConnectionStub } from "../__fixtures__/database-connection-stub";
import { MockDatabaseModel } from "../__fixtures__/mock-database-model";

describe("Blocks Business Repository", () => {
    let blocksBusinessRepository: Database.IBlocksBusinessRepository;
    let databaseService: Database.IDatabaseService;
    beforeEach(() => {
        blocksBusinessRepository = new BlocksBusinessRepository(() => databaseService);
        databaseService = {
            connection: new DatabaseConnectionStub()
        } as Database.IDatabaseService;
    });

    describe("findAll", () => {
        it("should invoke findAll on db repository", async () => {

            databaseService.connection.blocksRepository = {
                findAll: async params => params,
                getModel: () => new MockDatabaseModel()
            } as Database.IBlocksRepository;
            jest.spyOn(databaseService.connection.blocksRepository, "findAll").mockImplementation(async () => true);


            await blocksBusinessRepository.findAll({
                limit: 50,
                offset: 20
            });


            expect(databaseService.connection.blocksRepository.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: [{ field: "height", direction: "desc" }]
                }));
        });
    });

    describe("findById", () => {
        it("should invoke findById on db repository", async () => {

            databaseService.connection.blocksRepository = {
                findById : async id => id
            } as Database.IBlocksRepository;
            jest.spyOn(databaseService.connection.blocksRepository, "findById").mockImplementation(async () => true);


            await blocksBusinessRepository.findById("some id");


            expect(databaseService.connection.blocksRepository.findById).toHaveBeenCalledWith("some id");
        });
    });

    describe("search", () => {
        it("should invoke search on db repository", async () => {
            databaseService.connection.blocksRepository = {
                search: async params => params,
                getModel: () => new MockDatabaseModel()
            } as Database.IBlocksRepository;
            jest.spyOn(databaseService.connection.blocksRepository, "search").mockImplementation(async () => true);


            await blocksBusinessRepository.search({
                limit: 50,
                offset: 20,
                id: 20
            });


            expect(databaseService.connection.blocksRepository.search).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: [{
                        field: "id",
                        operator: expect.anything(),
                        value: 20
                    }],
                    orderBy: [{ field: "height", direction: "desc" }]
                }));
        });
    });

    describe("findAllByGenerator", () => {
        it("should search by generatorPublicKey", async () => {

            databaseService.connection.blocksRepository = {
                findAll: async params => params,
                getModel: () => new MockDatabaseModel()
            } as Database.IBlocksRepository;
            jest.spyOn(databaseService.connection.blocksRepository, "findAll").mockImplementation(async () => true);


            await blocksBusinessRepository.findAllByGenerator("pubKey", {limit: 50, offset: 13});


            expect(databaseService.connection.blocksRepository.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: [{
                        field: "generatorPublicKey",
                        operator: expect.anything(),
                        value: "pubKey"
                    }],
                    paginate: {
                        offset: 13,
                        limit: 50
                    }
                })
            );

        });
    });

    describe('findLastByPublicKey', () => {
        it('should search by publicKey', async () => {

            databaseService.connection.blocksRepository = {
                findAll: async params => params,
                getModel: () => new MockDatabaseModel()
            } as Database.IBlocksRepository;
            jest.spyOn(databaseService.connection.blocksRepository, "findAll").mockImplementation(async () => true);


            await blocksBusinessRepository.findLastByPublicKey("pubKey");


            expect(databaseService.connection.blocksRepository.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: [{
                        field: "generatorPublicKey",
                        operator: expect.anything(),
                        value: "pubKey"
                    }]
                })
            );
        });
    });

    describe('findByHeight', () => {
        it('should search by height', async () => {
            databaseService.connection.blocksRepository = {
                findAll: async params => params,
                getModel: () => new MockDatabaseModel()
            } as Database.IBlocksRepository;
            jest.spyOn(databaseService.connection.blocksRepository, "findAll").mockImplementation(async () => true);


            await blocksBusinessRepository.findByHeight(1);


            expect(databaseService.connection.blocksRepository.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: [{
                        field: "height",
                        operator: expect.anything(),
                        value: 1
                    }]
                })
            );
        });
    });
});
