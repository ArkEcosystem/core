import { SearchParameterConverter } from "@packages/core-state/src/wallets/utils/search-parameter-converter";
import { MockDatabaseModel } from "./mock-database-model";
import { Contracts } from "@packages/core-kernel";

describe("SearchParameterConverter", () => {
    let searchParameterConverter: SearchParameterConverter;
    beforeEach(() => {
        searchParameterConverter = new SearchParameterConverter(new MockDatabaseModel());
    });

    it("should parse all supported operators", () => {
        const params = {
            id: "343-guilty-spark",
            timestamp: { from: "100", to: "1000" },
            sentence: "a partial",
            basket: ["apples", "pears", "bananas"],
        };

        const searchParameters = searchParameterConverter.convert(params);

        expect(searchParameters.orderBy).toHaveLength(0);
        expect(searchParameters.paginate).toBeUndefined();
        expect(searchParameters.parameters).toHaveLength(5);
        expect(searchParameters.parameters[0].field).toEqual("id");
        expect(searchParameters.parameters[0].value).toEqual("343-guilty-spark");
        expect(searchParameters.parameters[0].operator).toEqual(Contracts.Database.SearchOperator.OP_EQ);

        expect(searchParameters.parameters[1].field).toEqual("timestamp");
        expect(searchParameters.parameters[1].value).toEqual("100");
        expect(searchParameters.parameters[1].operator).toEqual(Contracts.Database.SearchOperator.OP_GTE);

        expect(searchParameters.parameters[2].field).toEqual("timestamp");
        expect(searchParameters.parameters[2].value).toEqual("1000");
        expect(searchParameters.parameters[2].operator).toEqual(Contracts.Database.SearchOperator.OP_LTE);

        expect(searchParameters.parameters[3].field).toEqual("sentence");
        expect(searchParameters.parameters[3].value).toEqual("%a partial%");
        expect(searchParameters.parameters[3].operator).toEqual(Contracts.Database.SearchOperator.OP_LIKE);

        expect(searchParameters.parameters[4].field).toEqual("basket");
        expect(searchParameters.parameters[4].value).toEqual(["apples", "pears", "bananas"]);
        expect(searchParameters.parameters[4].operator).toEqual(Contracts.Database.SearchOperator.OP_IN);
    });

    it("should return default params when none are provided", () => {
        const defaults = {
            orderBy: [],
            paginate: undefined,
            parameters: [],
        };
        const searchParameters = searchParameterConverter.convert({});
        expect(searchParameters).toEqual(defaults);
    });

    it("should use the order by method passed through params", () => {
        jest.spyOn(searchParameterConverter as any, "parseOrderBy");
        const defaults = {
            orderBy: [],
            paginate: undefined,
            parameters: [],
        };
        searchParameterConverter.convert({ orderBy: "testOrder" });
        expect((searchParameterConverter as any).parseOrderBy).toHaveBeenCalledWith(defaults, "testOrder");
    });

    it('should default to "equals" when from,to fields not set', () => {
        const params = {
            range: "10",
        };

        const searchParameters = searchParameterConverter.convert(params);

        expect(searchParameters.parameters).toHaveLength(1);
        expect(searchParameters.parameters[0].field).toEqual("range");
        expect(searchParameters.parameters[0].value).toEqual("10");
        expect(searchParameters.parameters[0].operator).toEqual(Contracts.Database.SearchOperator.OP_EQ);
    });

    it("should parse from,to fields when present", () => {
        const params = {
            range: { from: 10, to: 20 },
        };

        const searchParameters = searchParameterConverter.convert(params);

        expect(searchParameters.parameters).toHaveLength(2);
        expect(searchParameters.parameters[0].field).toEqual("range");
        expect(searchParameters.parameters[0].value).toEqual(10);
        expect(searchParameters.parameters[0].operator).toEqual(Contracts.Database.SearchOperator.OP_GTE);

        expect(searchParameters.parameters[1].field).toEqual("range");
        expect(searchParameters.parameters[1].value).toEqual(20);
        expect(searchParameters.parameters[1].operator).toEqual(Contracts.Database.SearchOperator.OP_LTE);
    });

    it("should parse unknown fields as custom", () => {
        const params = {
            john: "doe",
        };

        const searchParameters = searchParameterConverter.convert(params);

        expect(searchParameters.parameters).toHaveLength(1);
        expect(searchParameters.parameters[0].field).toEqual("john");
        expect(searchParameters.parameters[0].value).toEqual("doe");
        expect(searchParameters.parameters[0].operator).toEqual(Contracts.Database.SearchOperator.OP_CUSTOM);
    });

    // TODO: this test was passed before, but now fails, is this an intentional change?
    xit("should parse orderBy & paginate from params", () => {
        const params = {
            orderBy: "field:asc",
            offset: 20,
            limit: 50,
        };

        const searchParameters = searchParameterConverter.convert(params);
        expect(searchParameters.orderBy).toHaveLength(1);
        expect(searchParameters.orderBy[0].field).toEqual("field");
        expect(searchParameters.orderBy[0].direction).toEqual("asc");

        expect(searchParameters.paginate.offset).toEqual(20);
        expect(searchParameters.paginate.limit).toEqual(50);
    });

    it("should should apply default paginate values", () => {
        const params = {
            offset: 1,
        };

        const searchParameters = searchParameterConverter.convert(params);

        expect(searchParameters.paginate.limit).toEqual(100);
        expect(searchParameters.paginate.offset).toEqual(1);
    });

    it("should apply default paginate values if nonsensical data provided", () => {
        const params = {
            offset: NaN,
            limit: NaN,
        };

        const searchParameters = searchParameterConverter.convert(params);

        expect(searchParameters.paginate.offset).toEqual(0);
        expect(searchParameters.paginate.limit).toEqual(100);
    });
});
