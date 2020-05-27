import { Container } from "@arkecosystem/core-kernel";

import { BlockHistoryService } from "../../../packages/core-database/src/block-history-service";

const blockRepository = {
    findManyByExpression: jest.fn(),
    listByExpression: jest.fn(),
};

const transactionRepository = {
    findManyByExpression: jest.fn(),
    listByExpression: jest.fn(),
};

const blockFilter = {
    getExpression: jest.fn(),
};

const transactionFilter = {
    getExpression: jest.fn(),
};

const blockModelConverter = {
    getBlockData: jest.fn(),
};

beforeEach(() => {
    blockRepository.findManyByExpression.mockReset();
    blockRepository.listByExpression.mockReset();

    transactionRepository.findManyByExpression.mockReset();
    transactionRepository.listByExpression.mockReset();

    blockFilter.getExpression.mockReset();

    transactionFilter.getExpression.mockReset();

    blockModelConverter.getBlockData.mockReset();
});

const container = new Container.Container();
container.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue(blockRepository);
container.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue(transactionRepository);
container.bind(Container.Identifiers.DatabaseBlockFilter).toConstantValue(blockFilter);
container.bind(Container.Identifiers.DatabaseTransactionFilter).toConstantValue(transactionFilter);
container.bind(Container.Identifiers.DatabaseBlockModelConverter).toConstantValue(blockModelConverter);

describe("BlockHistoryService.findOneByCriteria", () => {
    it("should return undefined when model wasn't found in repository", async () => {
        const criteria = {},
            expression = {};

        blockFilter.getExpression.mockResolvedValueOnce(expression);
        blockRepository.findManyByExpression.mockResolvedValueOnce([]);
        blockModelConverter.getBlockData.mockReturnValueOnce([]);

        const blockHistoryService = container.resolve(BlockHistoryService);
        const result = await blockHistoryService.findOneByCriteria(criteria);

        expect(blockFilter.getExpression).toBeCalledWith(criteria);
        expect(blockRepository.findManyByExpression).toBeCalledWith(expression);
        expect(blockModelConverter.getBlockData).toBeCalledWith([]);
        expect(result).toBeUndefined();
    });

    it("should return block data when model was found in repository", async () => {
        const criteria = {};
        const expression = {};
        const model = {};
        const data = {};

        blockFilter.getExpression.mockResolvedValueOnce(expression);
        blockRepository.findManyByExpression.mockResolvedValueOnce([model]);
        blockModelConverter.getBlockData.mockReturnValueOnce([data]);

        const blockHistoryService = container.resolve(BlockHistoryService);
        const result = await blockHistoryService.findOneByCriteria(criteria);

        expect(blockFilter.getExpression).toBeCalledWith(criteria);
        expect(blockRepository.findManyByExpression).toBeCalledWith(expression);
        expect(blockModelConverter.getBlockData).toBeCalledWith([model]);

        expect(result).toBe(data);
    });
});

describe("BlockHistoryService.findManyByCriteria", () => {
    it("should return array of block data", async () => {
        const criteria = {},
            expression = {},
            model1 = {},
            model2 = {},
            data1 = {},
            data2 = {};

        blockFilter.getExpression.mockResolvedValueOnce(expression);
        blockRepository.findManyByExpression.mockResolvedValueOnce([model1, model2]);
        blockModelConverter.getBlockData.mockReturnValueOnce([data1, data2]);

        const blockHistoryService = container.resolve(BlockHistoryService);
        const result = await blockHistoryService.findManyByCriteria(criteria);

        expect(blockFilter.getExpression).toBeCalledWith(criteria);
        expect(blockRepository.findManyByExpression).toBeCalledWith(expression);
        expect(blockModelConverter.getBlockData).toBeCalledWith([model1, model2]);

        expect(result.length).toBe(2);
        expect(result[0]).toBe(data1);
        expect(result[1]).toBe(data2);
    });
});

describe("BlockHistoryService.listByCriteria", () => {
    it("should return search result", async () => {
        const criteria = {},
            expression = {},
            model1 = {},
            model2 = {},
            data1 = {},
            data2 = {},
            order = [],
            page = { offset: 0, limit: 100 };

        blockFilter.getExpression.mockResolvedValueOnce(expression);
        blockRepository.listByExpression.mockResolvedValueOnce({
            rows: [model1, model2],
            count: 2,
            countIsEstimate: false,
        });
        blockModelConverter.getBlockData.mockReturnValueOnce([data1, data2]);

        const blockHistoryService = container.resolve(BlockHistoryService);
        const result = await blockHistoryService.listByCriteria(criteria, order, page);

        expect(blockFilter.getExpression).toBeCalledWith(criteria);
        expect(blockRepository.listByExpression).toBeCalledWith(expression, order, page, undefined);
        expect(blockModelConverter.getBlockData).toBeCalledWith([model1, model2]);
        expect(result).toEqual({
            rows: [data1, data2],
            count: 2,
            countIsEstimate: false,
        });
    });
});
