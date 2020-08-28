import { Container } from "@arkecosystem/core-kernel";
import { PaginationService } from "@arkecosystem/core-kernel/src/services/search/pagination-service";
import { Utils } from "@arkecosystem/crypto";

const container = new Container.Container();

describe("PaginationService.getPage", () => {
    it("should return items with undefined properties at the end", () => {
        const paginationService = container.resolve(PaginationService);
        const pagination = { offset: 0, limit: 100 };
        const items = [{ v: 1 }, { v: 3 }, {}, { v: 2 }];
        const sorting = [{ property: "v", direction: "asc" as const }];
        const resultsPage = paginationService.getPage(pagination, sorting, items);

        expect(resultsPage).toEqual({
            results: [{ v: 1 }, { v: 2 }, { v: 3 }, {}],
            totalCount: 4,
            meta: { totalCountIsEstimate: false },
        });
    });

    it("should return items with undefined properties at the end regardless of direction", () => {
        const paginationService = container.resolve(PaginationService);
        const pagination = { offset: 0, limit: 100 };
        const items = [{ v: 1 }, { v: 3 }, {}, { v: 2 }];
        const sorting = [{ property: "v", direction: "desc" as const }];
        const resultsPage = paginationService.getPage(pagination, sorting, items);

        expect(resultsPage).toEqual({
            results: [{ v: 3 }, { v: 2 }, { v: 1 }, {}],
            totalCount: 4,
            meta: { totalCountIsEstimate: false },
        });
    });

    it("should return items with null properties at the end before items with undefined properties", () => {
        const paginationService = container.resolve(PaginationService);
        const pagination = { offset: 0, limit: 100 };
        const items = [{ v: 1 }, { v: 3 }, {}, { v: null }, { v: 2 }];
        const sorting = [{ property: "v", direction: "asc" as const }];
        const resultsPage = paginationService.getPage(pagination, sorting, items);

        expect(resultsPage).toEqual({
            results: [{ v: 1 }, { v: 2 }, { v: 3 }, { v: null }, {}],
            totalCount: 5,
            meta: { totalCountIsEstimate: false },
        });
    });

    it("should return items with null properties at the end before items with undefined properties regardless of direction", () => {
        const paginationService = container.resolve(PaginationService);
        const pagination = { offset: 0, limit: 100 };
        const items = [{ v: 1 }, { v: null }, { v: 3 }, {}, { v: 2 }];
        const sorting = [{ property: "v", direction: "desc" as const }];
        const resultsPage = paginationService.getPage(pagination, sorting, items);

        expect(resultsPage).toEqual({
            results: [{ v: 3 }, { v: 2 }, { v: 1 }, { v: null }, {}],
            totalCount: 5,
            meta: { totalCountIsEstimate: false },
        });
    });

    it("should sort using second sorting instruction when first properties are equal", () => {
        const paginationService = container.resolve(PaginationService);
        const pagination = { offset: 0, limit: 100 };
        const items = [
            { a: 1, b: 200 },
            { a: 1, b: 101 },
            { a: 2, b: 100 },
        ];
        const sorting = [
            { property: "a", direction: "asc" as const },
            { property: "b", direction: "asc" as const },
        ];
        const resultsPage = paginationService.getPage(pagination, sorting, items);

        expect(resultsPage).toEqual({
            results: [
                { a: 1, b: 101 },
                { a: 1, b: 200 },
                { a: 2, b: 100 },
            ],
            totalCount: 3,
            meta: { totalCountIsEstimate: false },
        });
    });

    it("should sort by Utils.BigNumber property", () => {
        const paginationService = container.resolve(PaginationService);
        const pagination = { offset: 0, limit: 100 };
        const items = [{ v: Utils.BigNumber.make(1) }, { v: Utils.BigNumber.make(3) }, { v: Utils.BigNumber.make(2) }];
        const sorting = [{ property: "v", direction: "asc" as const }];
        const resultsPage = paginationService.getPage(pagination, sorting, items);

        expect(resultsPage).toEqual({
            results: [{ v: Utils.BigNumber.make(1) }, { v: Utils.BigNumber.make(2) }, { v: Utils.BigNumber.make(3) }],
            totalCount: 3,
            meta: { totalCountIsEstimate: false },
        });
    });
});
