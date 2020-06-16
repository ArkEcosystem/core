import { Lock } from "../../../../packages/core-kernel/src/utils/lock";

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
