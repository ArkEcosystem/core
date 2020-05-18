import { Container } from "@arkecosystem/core-kernel";

import { TransactionHistoryService } from "../../../packages/core-database/src/transaction-history-service";

const transactionRepository = {
    findOneByExpression: jest.fn(),
    findManyByExpression: jest.fn(),
    listByExpression: jest.fn(),
};

const transactionFilter = {
    getExpression: jest.fn(),
};

const transactionModelConverter = {
    getTransactionData: jest.fn(),
};

const container = new Container.Container();
container.bind(Container.Identifiers.DatabaseTransactionRepository).toConstantValue(transactionRepository);
container.bind(Container.Identifiers.DatabaseTransactionFilter).toConstantValue(transactionFilter);
container.bind(Container.Identifiers.DatabaseTransactionModelConverter).toConstantValue(transactionModelConverter);

describe("TransactionHistoryService.findOneByCriteria", () => {
    it("should return undefined when model wasn't found in repository", async () => {
        const criteria = {},
            expression = {},
            model = undefined;

        transactionFilter.getExpression.mockResolvedValueOnce(expression);
        transactionRepository.findOneByExpression.mockResolvedValueOnce(model);

        const blockHistoryService = container.resolve(TransactionHistoryService);
        const result = await blockHistoryService.findOneByCriteria(criteria);

        expect(transactionFilter.getExpression).toBeCalledWith(criteria);
        expect(transactionRepository.findOneByExpression).toBeCalledWith(expression);
        expect(result).toBeUndefined();
    });

    it("should return block data when model was found in repository", async () => {
        const criteria = {};
        const expression = {};
        const model = {};
        const data = {};

        transactionFilter.getExpression.mockResolvedValueOnce(expression);
        transactionRepository.findOneByExpression.mockResolvedValueOnce(model);
        transactionModelConverter.getTransactionData.mockReturnValueOnce(data);

        const blockHistoryService = container.resolve(TransactionHistoryService);
        const result = await blockHistoryService.findOneByCriteria(criteria);

        expect(transactionFilter.getExpression).toBeCalledWith(criteria);
        expect(transactionRepository.findOneByExpression).toBeCalledWith(expression);
        expect(transactionModelConverter.getTransactionData).toBeCalledWith(model);

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
        transactionModelConverter.getTransactionData.mockReturnValueOnce(data1).mockReturnValueOnce(data2);

        const blockHistoryService = container.resolve(TransactionHistoryService);
        const result = await blockHistoryService.findManyByCriteria(criteria);

        expect(transactionFilter.getExpression).toBeCalledWith(criteria);
        expect(transactionRepository.findManyByExpression).toBeCalledWith(expression);
        expect(transactionModelConverter.getTransactionData).toBeCalledWith(model1);
        expect(transactionModelConverter.getTransactionData).toBeCalledWith(model2);

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
        transactionModelConverter.getTransactionData.mockReturnValueOnce(data1).mockReturnValueOnce(data2);

        const blockHistoryService = container.resolve(TransactionHistoryService);
        const result = await blockHistoryService.listByCriteria(criteria, order, page);

        expect(transactionFilter.getExpression).toBeCalledWith(criteria);
        expect(transactionRepository.listByExpression).toBeCalledWith(expression, order, page, undefined);
        expect(transactionModelConverter.getTransactionData).toBeCalledWith(model1);
        expect(transactionModelConverter.getTransactionData).toBeCalledWith(model2);
        expect(result).toEqual({
            rows: [data1, data2],
            count: 2,
            countIsEstimate: false,
        });
    });
});
