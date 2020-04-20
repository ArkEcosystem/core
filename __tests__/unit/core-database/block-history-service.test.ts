import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { BlockHistoryService } from "../../../packages/core-database/src/block-history-service";

const blockFilter = {
    getExpression: jest.fn(),
};

const blockRepository = {
    findOneByExpression: jest.fn(),
    findManyByExpression: jest.fn(),
    listByExpression: jest.fn(),
};

const container = new Container.Container();
container.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue(blockRepository);
container.bind(Container.Identifiers.DatabaseBlockFilter).toConstantValue(blockFilter);

describe("BlockHistoryService.findOneByCriteria", () => {
    it("should return undefined when model wasn't found in repository", async () => {
        const criteria = { id: "123" };
        const expression = { property: "id", type: "equal", value: "123" };
        const model = undefined;

        blockFilter.getExpression.mockResolvedValueOnce(expression);
        blockRepository.findOneByExpression.mockResolvedValueOnce(model);

        const blockHistoryService = container.resolve(BlockHistoryService);
        const blockData = await blockHistoryService.findOneByCriteria(criteria);

        expect(blockFilter.getExpression).toBeCalledWith(criteria);
        expect(blockRepository.findOneByExpression).toBeCalledWith(expression);
        expect(blockData).toBeUndefined();
    });

    it("should return block data when model was found in repository", async () => {
        const criteria = { id: "123" };
        const expression = { property: "id", type: "equal", value: "123" };
        const model: Contracts.Database.BlockModel = {
            id: "123",
            version: 2,
            timestamp: 3600,
            previousBlock: "456",
            height: 100,
            numberOfTransactions: 5,
            totalAmount: Utils.BigNumber.make("10000"),
            totalFee: Utils.BigNumber.make("1000"),
            reward: Utils.BigNumber.make("100"),
            payloadLength: 1024,
            payloadHash: "0000000000",
            generatorPublicKey: "1111111111",
            blockSignature: "2222222222",
        };

        blockFilter.getExpression.mockResolvedValueOnce(expression);
        blockRepository.findOneByExpression.mockResolvedValueOnce(model);

        const blockHistoryService = container.resolve(BlockHistoryService);
        const blockData = await blockHistoryService.findOneByCriteria(criteria);

        expect(blockFilter.getExpression).toBeCalledWith(criteria);
        expect(blockRepository.findOneByExpression).toBeCalledWith(expression);

        const expectedBlockData: Interfaces.IBlockData = Object.assign({}, model);
        expect(blockData).toEqual(expectedBlockData);
    });
});

describe("BlockHistoryService.findManyByCriteria", () => {
    it("should return array of block data", async () => {
        const criteria = { height: { from: 100 } };
        const expression = { property: "height", type: "greaterThanEqual", from: 100 };
        const models: Contracts.Database.BlockModel[] = [
            {
                id: "123",
                version: 2,
                timestamp: 3600,
                previousBlock: "456",
                height: 100,
                numberOfTransactions: 5,
                totalAmount: Utils.BigNumber.make("10000"),
                totalFee: Utils.BigNumber.make("1000"),
                reward: Utils.BigNumber.make("100"),
                payloadLength: 1024,
                payloadHash: "0000000000",
                generatorPublicKey: "1111111111",
                blockSignature: "2222222222",
            },
            {
                id: "789",
                version: 2,
                timestamp: 7200,
                previousBlock: "123",
                height: 101,
                numberOfTransactions: 5,
                totalAmount: Utils.BigNumber.make("10000"),
                totalFee: Utils.BigNumber.make("1000"),
                reward: Utils.BigNumber.make("100"),
                payloadLength: 1024,
                payloadHash: "0000000000",
                generatorPublicKey: "1111111111",
                blockSignature: "2222222222",
            },
        ];

        blockFilter.getExpression.mockResolvedValueOnce(expression);
        blockRepository.findManyByExpression.mockResolvedValueOnce(models);

        const blockHistoryService = container.resolve(BlockHistoryService);
        const blockData = await blockHistoryService.findManyByCriteria(criteria);

        expect(blockFilter.getExpression).toBeCalledWith(criteria);
        expect(blockRepository.findManyByExpression).toBeCalledWith(expression);

        const expectedBlockData: Interfaces.IBlockData[] = [Object.assign({}, models[0]), Object.assign({}, models[1])];
        expect(blockData).toEqual(expectedBlockData);
    });
});

describe("BlockHistoryService.listByCriteria", () => {
    it("should return search result", async () => {
        const criteria = { height: { from: 100 } };
        const order = [];
        const page = { offset: 0, limit: 100 };
        const expression = { property: "height", type: "greaterThanEqual", from: 100 };
        const models: Contracts.Database.BlockModel[] = [
            {
                id: "123",
                version: 2,
                timestamp: 3600,
                previousBlock: "456",
                height: 100,
                numberOfTransactions: 5,
                totalAmount: Utils.BigNumber.make("10000"),
                totalFee: Utils.BigNumber.make("1000"),
                reward: Utils.BigNumber.make("100"),
                payloadLength: 1024,
                payloadHash: "0000000000",
                generatorPublicKey: "1111111111",
                blockSignature: "2222222222",
            },
            {
                id: "789",
                version: 2,
                timestamp: 7200,
                previousBlock: "123",
                height: 101,
                numberOfTransactions: 5,
                totalAmount: Utils.BigNumber.make("10000"),
                totalFee: Utils.BigNumber.make("1000"),
                reward: Utils.BigNumber.make("100"),
                payloadLength: 1024,
                payloadHash: "0000000000",
                generatorPublicKey: "1111111111",
                blockSignature: "2222222222",
            },
        ];
        const result: Contracts.Search.Result<Contracts.Database.BlockModel> = {
            rows: models,
            count: 2,
            countIsEstimate: false,
        };

        blockFilter.getExpression.mockResolvedValueOnce(expression);
        blockRepository.listByExpression.mockResolvedValueOnce(result);

        const blockHistoryService = container.resolve(BlockHistoryService);
        const blockData = await blockHistoryService.listByCriteria(criteria, order, page);

        expect(blockFilter.getExpression).toBeCalledWith(criteria);
        expect(blockRepository.listByExpression).toBeCalledWith(expression, order, page);

        const expectedResult: Contracts.Search.Result<Interfaces.IBlockData> = {
            rows: [Object.assign({}, models[0]), Object.assign({}, models[1])],
            count: 2,
            countIsEstimate: false,
        };
        expect(blockData).toEqual(expectedResult);
    });
});
