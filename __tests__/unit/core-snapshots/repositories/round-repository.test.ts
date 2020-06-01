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

    it("countInRange should resolve", async () => {
        mockQueryBuilder.getCount = jest.fn();
        await expect(repository.countInRange(1, 100)).toResolve();

        expect(mockQueryBuilder.getCount).toHaveBeenCalled();
    });
});
