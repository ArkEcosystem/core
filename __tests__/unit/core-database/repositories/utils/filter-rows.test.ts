import "jest-extended";

import { setUp, tearDown } from "../../__support__/setup";

let filterRows;

beforeAll(async done => {
    await setUp();

    filterRows = require("../../../../../packages/core-database/src/repositories/utils/filter-rows");

    done();
});

afterAll(async done => {
    await tearDown();

    done();
});

describe("Filter Rows", () => {
    const rows = [
        { a: 1, b: 2, c: [] },
        {
            a: 2,
            b: 2,
            c: ["dummy-1"],
            d: ["dummy-0"],
            e: "value-e-1",
        },
        { a: 3, b: 3, c: ["dummy-3", "dummy-1", "dummy-4"] },
        {
            a: 2,
            b: 4,
            c: ["dummy-2"],
            d: "dummy-0",
            e: "value-e-2",
        },
        { a: 3, b: 4, c: ["DUMMY-1"] },
        {
            c: ["nop"],
            d: "nop",
            e: "value-e-3",
        },
    ];

    describe("exact", () => {
        it("match objects with the same value than the parameter", () => {
            expect(filterRows(rows, { a: 1 }, { exact: ["a"] })).toEqual([rows[0]]);
            expect(filterRows(rows, { a: 3 }, { exact: ["a"] })).toEqual([rows[2], rows[4]]);
            expect(filterRows(rows, { a: 3, b: 3 }, { exact: ["a"] })).toEqual([rows[2], rows[4]]);
            expect(filterRows(rows, { a: 3, b: 3 }, { exact: ["a", "b"] })).toEqual([rows[2]]);
        });
    });

    describe("between", () => {
        it("match objects that include a value beween two parameters (included)", () => {
            expect(filterRows(rows, { a: { from: 3 } }, { between: ["a"] })).toEqual([rows[2], rows[4]]);
            expect(filterRows(rows, { a: { from: 2, to: 2 } }, { between: ["a"] })).toEqual([rows[1], rows[3]]);
            expect(filterRows(rows, { a: { to: 2 } }, { between: ["a"] })).toEqual([rows[0], rows[1], rows[3]]);
            expect(filterRows(rows, { b: { from: 3, to: 4 } }, { between: ["b"] })).toEqual([
                rows[2],
                rows[3],
                rows[4],
            ]);
        });
    });

    describe("in", () => {
        it("match objects that include some values of the parameters", () => {
            expect(filterRows(rows, { e: ["value-e-99"] }, { in: ["e"] })).toEqual([]);
            expect(filterRows(rows, { e: ["value-e-1", "value-e-3"] }, { in: ["e"] })).toEqual([rows[1], rows[5]]);
        });
    });

    // This filter is not used yet
    describe("any", () => {
        it("match objects that include some values of the parameters", () => {
            expect(filterRows(rows, { c: ["dummy-1"] }, { any: ["c"] })).toEqual([rows[1], rows[2]]);
            expect(filterRows(rows, { c: ["dummy-1"], d: ["dummy-0"] }, { any: ["c"] })).toEqual([rows[1], rows[2]]);
            expect(filterRows(rows, { c: ["dummy-1"], d: ["dummy-0"] }, { any: ["c", "d"] })).toEqual([
                rows[1],
                rows[2],
            ]);
        });
    });
});
