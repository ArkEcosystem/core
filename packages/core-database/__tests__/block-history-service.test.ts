import { Container, Contracts } from "@arkecosystem/core-kernel";

import { BlockHistoryService } from "../../../packages/core-database/src/block-history-service";

const defaultBlockSorting: Contracts.Search.Sorting = [{ property: "height", direction: "asc" }];

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

const modelConverter = {
    getBlockData: jest.fn(),
};

beforeEach(() => {
    blockRepository.findManyByExpression.mockReset();
    blockRepository.listByExpression.mockReset();

    transactionRepository.findManyByExpression.mockReset();
    transactionRepository.listByExpression.mockReset();

    blockFilter.getExpression.mockReset();

    transactionFilter.getExpression.mockReset();

    modelConverter.getBlockData.mockReset();
});

const container = new Container.Container();
container.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue(blockRepository);
container.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue(transactionRepository);
container.bind(Container.Identifiers.DatabaseBlockFilter).toConstantValue(blockFilter);
container.bind(Container.Identifiers.DatabaseTransactionFilter).toConstantValue(transactionFilter);
container.bind(Container.Identifiers.DatabaseModelConverter).toConstantValue(modelConverter);

describe("BlockHistoryService.findOneByCriteria", () => {
    it("should return undefined when model wasn't found in repository", async () => {
        const criteria = {},
            expression = {};

        blockFilter.getExpression.mockResolvedValueOnce(expression);
        blockRepository.findManyByExpression.mockResolvedValueOnce([]);
        modelConverter.getBlockData.mockReturnValueOnce([]);

        const blockHistoryService = container.resolve(BlockHistoryService);
        const result = await blockHistoryService.findOneByCriteria(criteria);

        expect(blockFilter.getExpression).toBeCalledWith(criteria);
        expect(blockRepository.findManyByExpression).toBeCalledWith(expression, defaultBlockSorting);
        expect(modelConverter.getBlockData).toBeCalledWith([]);
        expect(result).toBeUndefined();
    });

    it("should return block data when model was found in repository", async () => {
        const criteria = {};
        const expression = {};
        const model = {};
        const data = {};

        blockFilter.getExpression.mockResolvedValueOnce(expression);
        blockRepository.findManyByExpression.mockResolvedValueOnce([model]);
        modelConverter.getBlockData.mockReturnValueOnce([data]);

        const blockHistoryService = container.resolve(BlockHistoryService);
        const result = await blockHistoryService.findOneByCriteria(criteria);

        expect(blockFilter.getExpression).toBeCalledWith(criteria);
        expect(blockRepository.findManyByExpression).toBeCalledWith(expression, defaultBlockSorting);
        expect(modelConverter.getBlockData).toBeCalledWith([model]);

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
        modelConverter.getBlockData.mockReturnValueOnce([data1, data2]);

        const blockHistoryService = container.resolve(BlockHistoryService);
        const result = await blockHistoryService.findManyByCriteria(criteria);

        expect(blockFilter.getExpression).toBeCalledWith(criteria);
        expect(blockRepository.findManyByExpression).toBeCalledWith(expression, defaultBlockSorting);
        expect(modelConverter.getBlockData).toBeCalledWith([model1, model2]);

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
            results: [model1, model2],
            totalCount: 2,
            meta: { totalCountIsEstimate: false },
        });
        modelConverter.getBlockData.mockReturnValueOnce([data1, data2]);

        const blockHistoryService = container.resolve(BlockHistoryService);
        const result = await blockHistoryService.listByCriteria(criteria, order, page);

        expect(blockFilter.getExpression).toBeCalledWith(criteria);
        expect(blockRepository.listByExpression).toBeCalledWith(expression, order, page, undefined);
        expect(modelConverter.getBlockData).toBeCalledWith([model1, model2]);
        expect(result).toEqual({
            results: [data1, data2],
            totalCount: 2,
            meta: { totalCountIsEstimate: false },
        });
    });
});
