import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { TransactionHistoryService } from "../../../packages/core-database/src/transaction-history-service";

const jestfn = <T extends (...args: unknown[]) => unknown>(
    implementation?: (...args: Parameters<T>) => ReturnType<T>,
) => {
    return jest.fn(implementation);
};

const defaultTransactionSorting: Contracts.Search.Sorting = [
    { property: "blockHeight", direction: "asc" },
    { property: "sequence", direction: "asc" },
];

const blockRepository = {};

const transactionRepository = {
    findManyByExpression: jestfn<Repositories.TransactionRepository["findManyByExpression"]>(),
    streamByExpression: jestfn<Repositories.TransactionRepository["streamByExpression"]>(),
    listByExpression: jestfn<Repositories.TransactionRepository["listByExpression"]>(),
};

const blockFilter = {
    getExpression: jestfn<Contracts.Database.BlockFilter["getExpression"]>(),
};

const transactionFilter = {
    getExpression: jestfn<Contracts.Database.TransactionFilter["getExpression"]>(),
};

const modelConverter = {
    getTransactionData: jestfn<Contracts.Database.ModelConverter["getTransactionData"]>(),
};

beforeEach(() => {
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
        const criteria: Contracts.Shared.OrTransactionCriteria = Symbol.for("criteria") as any;
        const expression: Contracts.Search.Expression<Contracts.Database.TransactionModel> = Symbol.for("expr") as any;

        transactionFilter.getExpression.mockResolvedValueOnce(expression);
        transactionRepository.findManyByExpression.mockResolvedValueOnce([]);
        modelConverter.getTransactionData.mockReturnValueOnce([]);

        const blockHistoryService = container.resolve(TransactionHistoryService);
        const result = await blockHistoryService.findOneByCriteria(criteria);

        expect(transactionFilter.getExpression).toBeCalledWith(criteria);
        expect(transactionRepository.findManyByExpression).toBeCalledWith(expression, defaultTransactionSorting);
        expect(modelConverter.getTransactionData).toBeCalledWith([]);
        expect(result).toBeUndefined();
    });

    it("should return block data when model was found in repository", async () => {
        const criteria: Contracts.Shared.OrTransactionCriteria = Symbol.for("criteria") as any;
        const expression: Contracts.Search.Expression<Contracts.Database.TransactionModel> = Symbol.for("expr") as any;
        const model: Contracts.Database.TransactionModel = Symbol.for("model") as any;
        const data: Interfaces.ITransactionData = Symbol.for("data") as any;

        transactionFilter.getExpression.mockResolvedValueOnce(expression);
        transactionRepository.findManyByExpression.mockResolvedValueOnce([model]);
        modelConverter.getTransactionData.mockReturnValueOnce([data]);

        const blockHistoryService = container.resolve(TransactionHistoryService);
        const result = await blockHistoryService.findOneByCriteria(criteria);

        expect(transactionFilter.getExpression).toBeCalledWith(criteria);
        expect(transactionRepository.findManyByExpression).toBeCalledWith(expression, defaultTransactionSorting);
        expect(modelConverter.getTransactionData).toBeCalledWith([model]);

        expect(result).toBe(data);
    });
});

describe("TransactionHistoryService.findManyByCriteria", () => {
    it("should return array of block data", async () => {
        const criteria: Contracts.Shared.OrTransactionCriteria = Symbol.for("criteria") as any;
        const expression: Contracts.Search.Expression<Contracts.Database.TransactionModel> = Symbol.for("expr") as any;
        const model1: Contracts.Database.TransactionModel = Symbol.for("model") as any;
        const model2: Contracts.Database.TransactionModel = Symbol.for("model") as any;
        const data1: Interfaces.ITransactionData = Symbol.for("data") as any;
        const data2: Interfaces.ITransactionData = Symbol.for("data") as any;

        transactionFilter.getExpression.mockResolvedValueOnce(expression);
        transactionRepository.findManyByExpression.mockResolvedValueOnce([model1, model2]);
        modelConverter.getTransactionData.mockReturnValueOnce([data1, data2]);

        const transactionHistoryService = container.resolve(TransactionHistoryService);
        const result = await transactionHistoryService.findManyByCriteria(criteria);

        expect(transactionFilter.getExpression).toBeCalledWith(criteria);
        expect(transactionRepository.findManyByExpression).toBeCalledWith(expression, defaultTransactionSorting);
        expect(modelConverter.getTransactionData).toBeCalledWith([model1, model2]);

        expect(result.length).toBe(2);
        expect(result[0]).toBe(data1);
        expect(result[1]).toBe(data2);
    });
});

describe("TransactionHistoryService.streamByCriteria", () => {
    it("should yield array of block data", async () => {
        const criteria: Contracts.Shared.OrTransactionCriteria = Symbol.for("criteria") as any;
        const expression: Contracts.Search.Expression<Contracts.Database.TransactionModel> = Symbol.for("expr") as any;
        const model1: Contracts.Database.TransactionModel = Symbol.for("model") as any;
        const model2: Contracts.Database.TransactionModel = Symbol.for("model") as any;
        const data1: Interfaces.ITransactionData = Symbol.for("data") as any;
        const data2: Interfaces.ITransactionData = Symbol.for("data") as any;

        transactionFilter.getExpression.mockResolvedValueOnce(expression);
        transactionRepository.streamByExpression.mockImplementationOnce(async function* () {
            yield model1;
            yield model2;
        });
        modelConverter.getTransactionData.mockReturnValueOnce([data1]);
        modelConverter.getTransactionData.mockReturnValueOnce([data2]);

        const transactionHistoryService = container.resolve(TransactionHistoryService);
        const result: Interfaces.ITransactionData[] = [];
        for await (const data of transactionHistoryService.streamByCriteria(criteria)) {
            result.push(data);
        }

        expect(transactionFilter.getExpression).toBeCalledWith(criteria);
        expect(transactionRepository.streamByExpression).toBeCalledWith(expression, defaultTransactionSorting);
        expect(modelConverter.getTransactionData).toBeCalledWith([model1]);
        expect(modelConverter.getTransactionData).toBeCalledWith([model2]);

        expect(result.length).toBe(2);
        expect(result[0]).toBe(data1);
        expect(result[1]).toBe(data2);
    });
});

describe("TransactionHistoryService.listByCriteria", () => {
    it("should return search result", async () => {
        const criteria: Contracts.Shared.OrTransactionCriteria = Symbol.for("criteria") as any;
        const expression: Contracts.Search.Expression<Contracts.Database.TransactionModel> = Symbol.for("expr") as any;
        const model1: Contracts.Database.TransactionModel = Symbol.for("model") as any;
        const model2: Contracts.Database.TransactionModel = Symbol.for("model") as any;
        const data1: Interfaces.ITransactionData = Symbol.for("data") as any;
        const data2: Interfaces.ITransactionData = Symbol.for("data") as any;
        const sorting: Contracts.Search.Sorting = Symbol.for("order") as any;
        const pagination: Contracts.Search.Pagination = Symbol.for("page") as any;

        transactionFilter.getExpression.mockResolvedValueOnce(expression);
        transactionRepository.listByExpression.mockResolvedValueOnce({
            results: [model1, model2],
            totalCount: 2,
            meta: { totalCountIsEstimate: false },
        });
        modelConverter.getTransactionData.mockReturnValueOnce([data1, data2]);

        const blockHistoryService = container.resolve(TransactionHistoryService);
        const result = await blockHistoryService.listByCriteria(criteria, sorting, pagination);

        expect(transactionFilter.getExpression).toBeCalledWith(criteria);
        expect(transactionRepository.listByExpression).toBeCalledWith(expression, sorting, pagination, undefined);
        expect(modelConverter.getTransactionData).toBeCalledWith([model1, model2]);
        expect(result).toEqual({
            results: [data1, data2],
            totalCount: 2,
            meta: { totalCountIsEstimate: false },
        });
    });
});
