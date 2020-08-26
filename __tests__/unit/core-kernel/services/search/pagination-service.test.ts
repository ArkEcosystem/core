import { Container } from "@arkecosystem/core-kernel";
import { PaginationService } from "@arkecosystem/core-kernel/src/services/search/pagination-service";

const container = new Container.Container();

describe("PaginationService.compare", () => {
    it("should compare number properties", () => {
        const paginationService = container.resolve(PaginationService);
        const result = [{ v: 1 }, { v: 3 }, { v: 2 }].sort((a, b) =>
            paginationService.compare(a, b, [{ property: "v", direction: "asc" }]),
        );

        expect(result).toEqual([{ v: 1 }, { v: 2 }, { v: 3 }]);
    });
});
