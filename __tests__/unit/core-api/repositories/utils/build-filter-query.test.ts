import "jest-extended";

import { buildFilterQuery } from "../../../../../packages/core-api/src/repositories/utils/build-filter-query";

describe("Repository utils > buildFilterQuery", () => {
    describe("`in` filter", () => {
        describe("when the parameters are empty", () => {
            it("should generate where conditions", () => {
                const params = { a: ["a1", "a2", "a3"] };
                const query = buildFilterQuery(params, { in: [] });
                expect(query).toEqual([]);
            });
        });

        describe("when the parameters are not filterable", () => {
            it("should generate where conditions", () => {
                const params = { a: ["a1", "a2", "a3"] };
                const query = buildFilterQuery(params, { in: ["NOT"] });
                expect(query).toEqual([]);
            });
        });

        describe("when the parameters are filterable", () => {
            it("should generate where conditions", () => {
                const values = ["a1", "a2", "a3"];
                const params = { a: values };
                const query = buildFilterQuery(params, { in: ["a"] });
                expect(query).toEqual([{ column: "a", method: "in", value: values }]);
            });
        });
    });
});
