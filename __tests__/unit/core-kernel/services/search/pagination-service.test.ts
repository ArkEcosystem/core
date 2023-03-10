import { Container } from "@arkecosystem/core-kernel";
import { PaginationService } from "@arkecosystem/core-kernel/src/services/search/pagination-service";
import { Utils } from "@arkecosystem/crypto";

const container = new Container.Container();

describe("PaginationService.getEmptyPage", () => {
    it("should return empty page", () => {
        const paginationService = container.resolve(PaginationService);
        const emptyPage = paginationService.getEmptyPage();

        expect(emptyPage).toEqual({
            results: [],
            totalCount: 0,
            meta: { totalCountIsEstimate: false },
        });
    });
});

describe("PaginationService.getPage", () => {
    it("should leave items order intact when sorting isn't provided", async () => {
        const paginationService = container.resolve(PaginationService);
        const pagination = { offset: 0, limit: 100 };
        const items = [{ v: 1 }, { v: 3 }, {}, { v: 2 }];
        const sorting = [];
        const resultsPage = await paginationService.getPage(pagination, sorting, items);

        expect(resultsPage).toEqual({
            results: [{ v: 1 }, { v: 3 }, {}, { v: 2 }],
            totalCount: 4,
            meta: { totalCountIsEstimate: false },
        });
    });

    it("should leave items order intact when sorting by undefined property", async () => {
        const paginationService = container.resolve(PaginationService);
        const pagination = { offset: 0, limit: 100 };
        const items = [{ v: 1 }, { v: 3 }, {}, { v: 2 }];
        const sorting = [{ property: "dummy", direction: "asc" as const }];
        const resultsPage = await paginationService.getPage(pagination, sorting, items);

        expect(resultsPage).toEqual({
            results: [{ v: 1 }, { v: 3 }, {}, { v: 2 }],
            totalCount: 4,
            meta: { totalCountIsEstimate: false },
        });
    });

    it("should return items with undefined properties at the end", async () => {
        const paginationService = container.resolve(PaginationService);
        const pagination = { offset: 0, limit: 100 };
        const items = [{ v: 1 }, {}, { v: 3 }, {}, { v: 2 }];
        const sorting = [{ property: "v", direction: "asc" as const }];
        const resultsPage = await paginationService.getPage(pagination, sorting, items);

        expect(resultsPage).toEqual({
            results: [{ v: 1 }, { v: 2 }, { v: 3 }, {}, {}],
            totalCount: 5,
            meta: { totalCountIsEstimate: false },
        });
    });

    it("should return items with undefined properties at the end regardless of direction", async () => {
        const paginationService = container.resolve(PaginationService);
        const pagination = { offset: 0, limit: 100 };
        const items = [{ v: 1 }, { v: 3 }, {}, { v: 2 }];
        const sorting = [{ property: "v", direction: "desc" as const }];
        const resultsPage = await paginationService.getPage(pagination, sorting, items);

        expect(resultsPage).toEqual({
            results: [{ v: 3 }, { v: 2 }, { v: 1 }, {}],
            totalCount: 4,
            meta: { totalCountIsEstimate: false },
        });
    });

    it("should return items with null properties at the end before items with undefined properties", async () => {
        const paginationService = container.resolve(PaginationService);
        const pagination = { offset: 0, limit: 100 };
        const items = [{ v: 1 }, { v: 3 }, {}, { v: null }, { v: 2 }, { v: null }];
        const sorting = [{ property: "v", direction: "asc" as const }];
        const resultsPage = await paginationService.getPage(pagination, sorting, items);

        expect(resultsPage).toEqual({
            results: [{ v: 1 }, { v: 2 }, { v: 3 }, { v: null }, { v: null }, {}],
            totalCount: 6,
            meta: { totalCountIsEstimate: false },
        });
    });

    it("should return items with null properties at the end before items with undefined properties regardless of direction", async () => {
        const paginationService = container.resolve(PaginationService);
        const pagination = { offset: 0, limit: 100 };
        const items = [{ v: 1 }, { v: null }, { v: 3 }, {}, { v: 2 }];
        const sorting = [{ property: "v", direction: "desc" as const }];
        const resultsPage = await paginationService.getPage(pagination, sorting, items);

        expect(resultsPage).toEqual({
            results: [{ v: 3 }, { v: 2 }, { v: 1 }, { v: null }, {}],
            totalCount: 5,
            meta: { totalCountIsEstimate: false },
        });
    });

    it("should sort using second sorting instruction when first properties are equal booleans", async () => {
        const paginationService = container.resolve(PaginationService);
        const pagination = { offset: 0, limit: 100 };
        const items = [
            { a: false, b: 200 },
            { a: false, b: 101 },
            { a: true, b: 100 },
        ];
        const sorting = [
            { property: "a", direction: "asc" as const },
            { property: "b", direction: "asc" as const },
        ];
        const resultsPage = await paginationService.getPage(pagination, sorting, items);

        expect(resultsPage).toEqual({
            results: [
                { a: false, b: 101 },
                { a: false, b: 200 },
                { a: true, b: 100 },
            ],
            totalCount: 3,
            meta: { totalCountIsEstimate: false },
        });
    });

    it("should sort using second sorting instruction when first properties are equal strings", async () => {
        const paginationService = container.resolve(PaginationService);
        const pagination = { offset: 0, limit: 100 };
        const items = [
            { a: "a", b: 200 },
            { a: "a", b: 101 },
            { a: "b", b: 100 },
        ];
        const sorting = [
            { property: "a", direction: "asc" as const },
            { property: "b", direction: "asc" as const },
        ];
        const resultsPage = await paginationService.getPage(pagination, sorting, items);

        expect(resultsPage).toEqual({
            results: [
                { a: "a", b: 101 },
                { a: "a", b: 200 },
                { a: "b", b: 100 },
            ],
            totalCount: 3,
            meta: { totalCountIsEstimate: false },
        });
    });

    it("should sort using second sorting instruction when first properties are equal numbers", async () => {
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
        const resultsPage = await paginationService.getPage(pagination, sorting, items);

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

    it("should sort using second sorting instruction when first properties are equal bigints", async () => {
        const paginationService = container.resolve(PaginationService);
        const pagination = { offset: 0, limit: 100 };
        const items = [
            { a: BigInt(1), b: 200 },
            { a: BigInt(1), b: 101 },
            { a: BigInt(2), b: 100 },
        ];
        const sorting = [
            { property: "a", direction: "asc" as const },
            { property: "b", direction: "asc" as const },
        ];
        const resultsPage = await paginationService.getPage(pagination, sorting, items);

        expect(resultsPage).toEqual({
            results: [
                { a: BigInt(1), b: 101 },
                { a: BigInt(1), b: 200 },
                { a: BigInt(2), b: 100 },
            ],
            totalCount: 3,
            meta: { totalCountIsEstimate: false },
        });
    });

    it("should sort using second sorting instruction when first properties are equal Utils.BigNumber instances", async () => {
        const paginationService = container.resolve(PaginationService);
        const pagination = { offset: 0, limit: 100 };
        const items = [
            { a: Utils.BigNumber.make("1"), b: 200 },
            { a: Utils.BigNumber.make("1"), b: 101 },
            { a: Utils.BigNumber.make("2"), b: 100 },
        ];
        const sorting = [
            { property: "a", direction: "asc" as const },
            { property: "b", direction: "asc" as const },
        ];
        const resultsPage = await paginationService.getPage(pagination, sorting, items);

        expect(resultsPage).toEqual({
            results: [
                { a: Utils.BigNumber.make("1"), b: 101 },
                { a: Utils.BigNumber.make("1"), b: 200 },
                { a: Utils.BigNumber.make("2"), b: 100 },
            ],
            totalCount: 3,
            meta: { totalCountIsEstimate: false },
        });
    });

    it("should sort using second sorting instruction when first properties are null", async () => {
        const paginationService = container.resolve(PaginationService);
        const pagination = { offset: 0, limit: 100 };
        const items = [
            { a: null, b: 101 },
            { a: true, b: 100 },
            { a: null, b: 200 },
        ];
        const sorting = [
            { property: "a", direction: "asc" as const },
            { property: "b", direction: "asc" as const },
        ];
        const resultsPage = await paginationService.getPage(pagination, sorting, items);

        expect(resultsPage).toEqual({
            results: [
                { a: true, b: 100 },
                { a: null, b: 101 },
                { a: null, b: 200 },
            ],
            totalCount: 3,
            meta: { totalCountIsEstimate: false },
        });
    });

    it("should sort using second sorting instruction when first properties are undefined", async () => {
        const paginationService = container.resolve(PaginationService);
        const pagination = { offset: 0, limit: 100 };
        const items = [
            { a: undefined, b: 200 },
            { a: undefined, b: 101 },
            { a: true, b: 100 },
        ];
        const sorting = [
            { property: "a", direction: "asc" as const },
            { property: "b", direction: "asc" as const },
        ];
        const resultsPage = await paginationService.getPage(pagination, sorting, items);

        expect(resultsPage).toEqual({
            results: [
                { a: true, b: 100 },
                { a: undefined, b: 101 },
                { a: undefined, b: 200 },
            ],
            totalCount: 3,
            meta: { totalCountIsEstimate: false },
        });
    });

    it("should sort by Utils.BigNumber property", async () => {
        const paginationService = container.resolve(PaginationService);
        const pagination = { offset: 0, limit: 100 };
        const items = [{ v: Utils.BigNumber.make(1) }, { v: Utils.BigNumber.make(3) }, { v: Utils.BigNumber.make(2) }];
        const sorting = [{ property: "v", direction: "asc" as const }];
        const resultsPage = await paginationService.getPage(pagination, sorting, items);

        expect(resultsPage).toEqual({
            results: [{ v: Utils.BigNumber.make(1) }, { v: Utils.BigNumber.make(2) }, { v: Utils.BigNumber.make(3) }],
            totalCount: 3,
            meta: { totalCountIsEstimate: false },
        });
    });

    it("should throw when sorting over property with union type", async () => {
        const paginationService = container.resolve(PaginationService);
        const pagination = { offset: 0, limit: 100 };
        const items: { v: number | string }[] = [{ v: 1 }, { v: "2" }];
        const sorting = [{ property: "v", direction: "asc" as const }];

        await expect(() => paginationService.getPage(pagination, sorting, items)).rejects.toThrowError(
            "Mismatched types 'string' and 'number' at 'v'",
        );
    });

    it("should throw when sorting over property with invalid type", async () => {
        const paginationService = container.resolve(PaginationService);
        const pagination = { offset: 0, limit: 100 };
        const items = [{ v: Symbol() }, { v: Symbol() }];
        const sorting = [{ property: "v", direction: "asc" as const }];

        await expect(() => paginationService.getPage(pagination, sorting, items)).rejects.toThrowError(
            "Unexpected type at 'v'",
        );
    });
});
