import "jest-extended";

import { Utils } from "@packages/core-kernel";
import { BlockRepository } from "@packages/core-snapshots/src/repositories";

import { Assets } from "../__fixtures__";

class MockQueryBuilder {
    public where(...data) {
        return this;
    }

    public orderBy(...data) {
        return this;
    }

    public delete(...data) {
        return this;
    }

    public from(...data) {
        return this;
    }

    public select(...data) {
        return this;
    }
}

let mockQueryBuilder;

let repository: BlockRepository;
beforeEach(() => {
    repository = new BlockRepository();

    mockQueryBuilder = new MockQueryBuilder();

    repository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("BlockRepository", () => {
    it("getReadStream should resolve", async () => {
        mockQueryBuilder.stream = jest.fn();

        await expect(repository.getReadStream(1, 100)).toResolve();
        expect(mockQueryBuilder.stream).toHaveBeenCalled();
    });

    it("truncate should resolve", async () => {
        // @ts-ignore
        repository.manager = {
            query: jest.fn(),
        };

        await expect(repository.truncate()).toResolve();
        expect(repository.manager.query).toHaveBeenCalledWith("TRUNCATE TABLE transactions, rounds, blocks");
    });

    it("fastCount should resolve", async () => {
        mockQueryBuilder.getRawOne = jest.fn().mockResolvedValue({
            total_count: "100",
        });

        await expect(repository.fastCount()).resolves.toEqual(100);
        expect(mockQueryBuilder.getRawOne).toHaveBeenCalled();
    });

    it("countInRange should resolve", async () => {
        mockQueryBuilder.getRawOne = jest.fn().mockResolvedValue({
            total_count: "100",
        });

        await expect(repository.countInRange(1, 100)).resolves.toEqual(100);
        expect(mockQueryBuilder.getRawOne).toHaveBeenCalled();
    });

    it("findLast should resolve", async () => {
        repository.find = jest.fn().mockResolvedValue(Assets.blocks);

        await expect(repository.findLast()).resolves.toEqual(Assets.blocks[0]);
        expect(repository.find).toHaveBeenCalled();
    });

    it("findFirst should resolve", async () => {
        repository.find = jest.fn().mockResolvedValue(Assets.blocks);

        await expect(repository.findFirst()).resolves.toEqual(Assets.blocks[0]);
        expect(repository.find).toHaveBeenCalled();
    });

    it("findByHeight should resolve", async () => {
        repository.findOne = jest.fn().mockResolvedValue(Assets.blocks[0]);

        await expect(repository.findByHeight(1)).resolves.toEqual(Assets.blocks[0]);
        expect(repository.findOne).toHaveBeenCalled();
    });

    it("rollback should resolve", async () => {
        repository.findByHeight = jest.fn().mockResolvedValue(Assets.blocks[0]);

        mockQueryBuilder.execute = jest.fn();
        const mockManager = {
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
        };

        Object.defineProperty(repository, "manager", {
            value: {
                transaction: async (func) => {
                    await func(mockManager);
                },
            },
            writable: true,
        });

        const round = Utils.roundCalculator.calculateRound(1);

        await expect(repository.rollback(round)).toResolve();
        expect(repository.findByHeight).toHaveBeenCalled();
        expect(mockQueryBuilder.execute).toHaveBeenCalledTimes(3);
    });

    it("rollback should throw if cannot find block", async () => {
        repository.findByHeight = jest.fn().mockResolvedValue(undefined);
        const round = Utils.roundCalculator.calculateRound(1);

        await expect(repository.rollback(round)).rejects.toThrow();
        expect(repository.findByHeight).toHaveBeenCalled();
    });
});
