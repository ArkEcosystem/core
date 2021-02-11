import "jest-extended";

import { RoundRepository } from "@packages/core-snapshots/src/repositories";

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

let repository: RoundRepository;
beforeEach(() => {
    repository = new RoundRepository();

    mockQueryBuilder = new MockQueryBuilder();

    repository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("RoundRepository", () => {
    it("getReadStream should resolve", async () => {
        mockQueryBuilder.stream = jest.fn();

        await expect(repository.getReadStream(1, 100)).toResolve();
        expect(mockQueryBuilder.stream).toHaveBeenCalled();
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
});
