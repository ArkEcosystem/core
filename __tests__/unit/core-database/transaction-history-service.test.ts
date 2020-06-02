import { Container } from "@arkecosystem/core-kernel";

import { TransactionHistoryService } from "../../../packages/core-database/src/transaction-history-service";

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
    getTransactionData: jest.fn(),
};

beforeEach(() => {
    blockRepository.findManyByExpression.mockReset();
    blockRepository.listByExpression.mockReset();

    transactionRepository.findManyByExpression.mockReset();
    transactionRepository.listByExpression.mockReset();

    blockFilter.getExpression.mockReset();

    transactionFilter.getExpression.mockReset();

    modelConverter.getTransactionData.mockReset();
});

const container = new Container.Container();
container.bind(Container.Identifiers.DatabaseBlockRepository).toConstantValue(blockRepository);
container.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue(transactionRepository);
container.bind(Container.Identifiers.DatabaseBlockFilter).toConstantValue(blockFilter);
container.bind(Container.Identifiers.DatabaseTransactionFilter).toConstantValue(transactionFilter);
container.bind(Container.Identifiers.DatabaseModelConverter).toConstantValue(modelConverter);

describe("TransactionHistoryService.findOneByCriteria", () => {
    it("should return undefined when model wasn't found in repository", async () => {
        const criteria = {},
            expression = {};

        transactionFilter.getExpression.mockResolvedValueOnce(expression);
        transactionRepository.findManyByExpression.mockResolvedValueOnce([]);
        modelConverter.getTransactionData.mockReturnValueOnce([]);

        const blockHistoryService = container.resolve(TransactionHistoryService);
        const result = await blockHistoryService.findOneByCriteria(criteria);

        expect(transactionFilter.getExpression).toBeCalledWith(criteria);
        expect(transactionRepository.findManyByExpression).toBeCalledWith(expression);
        expect(modelConverter.getTransactionData).toBeCalledWith([]);
        expect(result).toBeUndefined();
    });

    it("should return block data when model was found in repository", async () => {
        const criteria = {};
        const expression = {};
        const model = {};
        const data = {};

        transactionFilter.getExpression.mockResolvedValueOnce(expression);
        transactionRepository.findManyByExpression.mockResolvedValueOnce([model]);
        modelConverter.getTransactionData.mockReturnValueOnce([data]);

        const blockHistoryService = container.resolve(TransactionHistoryService);
        const result = await blockHistoryService.findOneByCriteria(criteria);

        expect(transactionFilter.getExpression).toBeCalledWith(criteria);
        expect(transactionRepository.findManyByExpression).toBeCalledWith(expression);
        expect(modelConverter.getTransactionData).toBeCalledWith([model]);

        expect(result).toBe(data);
    });
});

describe("TransactionHistoryService.findManyByCriteria", () => {
    it("should return array of block data", async () => {
        const criteria = {},
            expression = {},
            model1 = {},
            model2 = {},
            data1 = {},
            data2 = {};

        transactionFilter.getExpression.mockResolvedValueOnce(expression);
        transactionRepository.findManyByExpression.mockResolvedValueOnce([model1, model2]);
        modelConverter.getTransactionData.mockReturnValueOnce([data1, data2]);

        const blockHistoryService = container.resolve(TransactionHistoryService);
        const result = await blockHistoryService.findManyByCriteria(criteria);

        expect(transactionFilter.getExpression).toBeCalledWith(criteria);
        expect(transactionRepository.findManyByExpression).toBeCalledWith(expression);
        expect(modelConverter.getTransactionData).toBeCalledWith([model1, model2]);

        expect(result.length).toBe(2);
        expect(result[0]).toBe(data1);
        expect(result[1]).toBe(data2);
    });
});

describe("TransactionHistoryService.listByCriteria", () => {
    it("should return search result", async () => {
        const criteria = {},
            expression = {},
            model1 = {},
            model2 = {},
            data1 = {},
            data2 = {},
            order = [],
            page = { offset: 0, limit: 100 };

        transactionFilter.getExpression.mockResolvedValueOnce(expression);
        transactionRepository.listByExpression.mockResolvedValueOnce({
            rows: [model1, model2],
            count: 2,
            countIsEstimate: false,
        });
        modelConverter.getTransactionData.mockReturnValueOnce([data1, data2]);

        const blockHistoryService = container.resolve(TransactionHistoryService);
        const result = await blockHistoryService.listByCriteria(criteria, order, page);

        expect(transactionFilter.getExpression).toBeCalledWith(criteria);
        expect(transactionRepository.listByExpression).toBeCalledWith(expression, order, page, undefined);
        expect(modelConverter.getTransactionData).toBeCalledWith([model1, model2]);
        expect(result).toEqual({
            rows: [data1, data2],
            count: 2,
            countIsEstimate: false,
        });
    });
});
