import "jest-extended";

import limitRows from "@packages/core-state/src/wallets/utils/limit-rows";

describe("limitRows", () => {
    it("should return an array with limited rows", () => {
        const testArray = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        expect(limitRows(testArray, { offset: 0, limit: 5 })).toEqual([1, 2, 3, 4, 5]);
    });

    it("should return an array with limited rows, starting from the offset", () => {
        const testArray = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        expect(limitRows(testArray, { offset: 4, limit: 5 })).toEqual([5, 6, 7, 8, 9]);
    });

    it("if the offset is too large it should return an empty array", () => {
        const testArray = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        expect(limitRows(testArray, { offset: 11, limit: 5 })).toEqual([]);
    });

    it("if the offset takes us past the limit, return the available elements", () => {
        const testArray = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        expect(limitRows(testArray, { offset: 7, limit: 5 })).toEqual([8, 9]);
    });
});
