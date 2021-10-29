import { IteratorMany } from "../../../packages/core-transaction-pool/src/utils";

describe("IteratorMany", () => {
    it("should choose next item based on comparator", () => {
        const iter1 = [1, 5, 3, 9, 0][Symbol.iterator]();
        const iter2 = [8, 2, 7, 4, 6][Symbol.iterator]();
        const iteratorMany = new IteratorMany([iter1, iter2], (a, b) => a - b);

        // [1, 5, 3, 9, 0], [8, 2, 7, 4, 6]
        expect(iteratorMany.next()).toStrictEqual({ done: false, value: 1 });
        // [5, 3, 9, 0], [8, 2, 7, 4, 6]
        expect(iteratorMany.next()).toStrictEqual({ done: false, value: 5 });
        // [3, 9, 0], [8, 2, 7, 4, 6]
        expect(iteratorMany.next()).toStrictEqual({ done: false, value: 3 });
        // [9, 0], [8, 2, 7, 4, 6]
        expect(iteratorMany.next()).toStrictEqual({ done: false, value: 8 });
        // [9, 0], [2, 7, 4, 6]
        expect(iteratorMany.next()).toStrictEqual({ done: false, value: 2 });
        // [9, 0], [7, 4, 6]
        expect(iteratorMany.next()).toStrictEqual({ done: false, value: 7 });
        // [9, 0], [4, 6]
        expect(iteratorMany.next()).toStrictEqual({ done: false, value: 4 });
        // [9, 0], [6]
        expect(iteratorMany.next()).toStrictEqual({ done: false, value: 6 });
        // [9, 0], []
        expect(iteratorMany.next()).toStrictEqual({ done: false, value: 9 });
        // [0], []
        expect(iteratorMany.next()).toStrictEqual({ done: false, value: 0 });
        // [], []
        expect(iteratorMany.next()).toStrictEqual({ done: true, value: undefined });
    });
});
