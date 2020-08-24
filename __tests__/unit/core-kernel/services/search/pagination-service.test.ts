import { Container } from "@arkecosystem/core-kernel";
import { PaginationService } from "@arkecosystem/core-kernel/src/services/search/pagination-service";

const container = new Container.Container();

describe("PaginationService.compareValues", () => {
    it("should compare number values", () => {
        const paginationService = container.resolve(PaginationService);
        const result = [1, 3, 2].sort((a, b) => paginationService.compareValues(a, b));

        expect(result).toEqual([1, 2, 3]);
    });
});
