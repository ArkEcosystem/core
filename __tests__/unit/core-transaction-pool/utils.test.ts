import { IteratorMany, Lock } from "../../../packages/core-transaction-pool/src/utils";

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

describe("Lock", () => {
    it("should run exclusive executions in series", async () => {
        let resolve: () => void;
        const promise = new Promise((r) => (resolve = r));

        let executions = 0;
        const fn = async () => {
            executions++;
            await promise;
            return executions;
        };

        const lock = new Lock();
        const exclusive1 = lock.runExclusive(fn);
        const exclusive2 = lock.runExclusive(fn);
        const exclusive3 = lock.runExclusive(fn);

        resolve();

        const results = await Promise.all([exclusive1, exclusive2, exclusive3]);

        expect(results).toEqual([1, 2, 3]);
    });

    it("should run non-exclusive executions in parallel", async () => {
        let resolve: () => void;
        const promise = new Promise((r) => (resolve = r));

        let executions = 0;
        const fn = async () => {
            executions++;
            await promise;
            return executions;
        };

        const lock = new Lock();
        const nonExclusive1 = lock.runNonExclusive(fn);
        const nonExclusive2 = lock.runNonExclusive(fn);
        const nonExclusive3 = lock.runNonExclusive(fn);

        resolve();

        const results = await Promise.all([nonExclusive1, nonExclusive2, nonExclusive3]);

        expect(results).toEqual([3, 3, 3]);
    });

    it("should run exclusive execution after non-exclusive had finished", async () => {
        let resolve: () => void;
        const promise = new Promise((r) => (resolve = r));

        let executions = 0;
        const fn = async () => {
            executions++;
            await promise;
            return executions;
        };

        const lock = new Lock();
        const nonExclusive1 = lock.runNonExclusive(fn);
        const nonExclusive2 = lock.runNonExclusive(fn);
        const exclusive1 = lock.runExclusive(fn);

        resolve();

        const results = await Promise.all([nonExclusive1, nonExclusive2, exclusive1]);

        expect(results).toEqual([2, 2, 3]);
    });
});
