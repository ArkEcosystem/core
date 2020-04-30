import { SortedArray } from "@arkecosystem/core-utils/src/sorted-array";
import { Utils } from "@arkecosystem/crypto";

describe("SortedArray", () => {
    // using Bignumbers for the tests
    const compareFunction = (a: Utils.BigNumber, b: Utils.BigNumber) => {
        if (a.isGreaterThan(b)) {
            return 1;
        }
        if (a.isLessThan(b)) {
            return -1;
        }
        return 0;
    };

    describe("insert", () => {
        it("should insert sorted", () => {
            const sortedArray = new SortedArray(compareFunction);

            const bignums: Utils.BigNumber[] = [];
            for (let i = 0; i < 1000; i++) {
                const randomBignum = Utils.BigNumber.make(Math.floor(Math.random() * 1000000));
                if (bignums.find(b => b.isEqualTo(randomBignum))) {
                    continue;
                }

                sortedArray.insert(randomBignum);
                bignums.push(randomBignum);
            }

            expect(sortedArray.getAll()).toEqual(bignums.sort(compareFunction));
        });

        it("should insert sorted - when some values are identical", () => {
            const sortedArray = new SortedArray(compareFunction);

            const bignums: Utils.BigNumber[] = [];
            for (let i = 0; i < 1000; i++) {
                const randomBignum = Utils.BigNumber.make(Math.floor(Math.random() * 100));
                sortedArray.insert(randomBignum);
                bignums.push(randomBignum);
            }

            expect(sortedArray.getAll()).toEqual(bignums.sort(compareFunction));
        });
    });

    describe("findIndex", () => {
        it("should find the index corresponding to the find function", () => {
            const sortedArray = new SortedArray(compareFunction);

            const bignums: Utils.BigNumber[] = [];
            for (let i = 0; i < 1000; i++) {
                const randomBignum = Utils.BigNumber.make(Math.floor(Math.random() * 1000000));
                if (bignums.find(b => b.isEqualTo(randomBignum))) {
                    continue;
                }

                sortedArray.insert(randomBignum);
                bignums.push(randomBignum);
            }

            const findLastInserted = sortedArray.findIndex(bignum => bignum.isEqualTo(bignums[bignums.length - 1]));
            const all = sortedArray.getAll();
            expect(all[findLastInserted]).toEqual(bignums[bignums.length - 1]);
        });
    });

    describe("removeAtIndex", () => {
        it("should remove the item at the index specified", () => {
            const sortedArray = new SortedArray(compareFunction);
            const bignums = [
                Utils.BigNumber.make(2),
                Utils.BigNumber.make(5),
                Utils.BigNumber.make(11),
                Utils.BigNumber.make(34),
                Utils.BigNumber.make(555),
            ];
            for (const bignum of bignums) {
                sortedArray.insert(bignum);
            }

            sortedArray.removeAtIndex(0);
            expect(sortedArray.getAll()).toEqual(bignums.slice(1));

            sortedArray.removeAtIndex(2);
            expect(sortedArray.getAll()).toEqual([
                Utils.BigNumber.make(5),
                Utils.BigNumber.make(11),
                Utils.BigNumber.make(555),
            ]);
        });
    });

    describe("getStrictlyBelow", () => {
        it("should get the items strictly below item specified", () => {
            const sortedArray = new SortedArray(compareFunction);
            const bignums = [
                Utils.BigNumber.make(2),
                Utils.BigNumber.make(5),
                Utils.BigNumber.make(11),
                Utils.BigNumber.make(34),
                Utils.BigNumber.make(555),
            ];
            for (const bignum of bignums) {
                sortedArray.insert(bignum);
            }

            expect(sortedArray.getStrictlyBelow(Utils.BigNumber.make(12))).toEqual([
                Utils.BigNumber.make(2),
                Utils.BigNumber.make(5),
                Utils.BigNumber.make(11),
            ]);

            expect(sortedArray.getStrictlyBelow(Utils.BigNumber.make(11))).toEqual([
                Utils.BigNumber.make(2),
                Utils.BigNumber.make(5),
            ]);

            expect(sortedArray.getStrictlyBelow(Utils.BigNumber.make(2))).toEqual([]);

            expect(sortedArray.getStrictlyBelow(Utils.BigNumber.make(1))).toEqual([]);

            expect(sortedArray.getStrictlyBelow(Utils.BigNumber.make(556))).toEqual(bignums);
        });
    });

    describe("getStrictlyBetween", () => {
        it("should get the items strictly between items specified", () => {
            const sortedArray = new SortedArray(compareFunction);
            const bignums = [
                Utils.BigNumber.make(2),
                Utils.BigNumber.make(5),
                Utils.BigNumber.make(11),
                Utils.BigNumber.make(34),
                Utils.BigNumber.make(555),
            ];
            for (const bignum of bignums) {
                sortedArray.insert(bignum);
            }

            expect(sortedArray.getStrictlyBetween(Utils.BigNumber.make(1), Utils.BigNumber.make(12))).toEqual([
                Utils.BigNumber.make(2),
                Utils.BigNumber.make(5),
                Utils.BigNumber.make(11),
            ]);

            expect(sortedArray.getStrictlyBetween(Utils.BigNumber.make(1), Utils.BigNumber.make(11))).toEqual([
                Utils.BigNumber.make(2),
                Utils.BigNumber.make(5),
            ]);

            expect(sortedArray.getStrictlyBetween(Utils.BigNumber.make(2), Utils.BigNumber.make(11))).toEqual([
                Utils.BigNumber.make(5),
            ]);

            expect(sortedArray.getStrictlyBetween(Utils.BigNumber.make(2), Utils.BigNumber.make(4))).toEqual([]);

            expect(sortedArray.getStrictlyBetween(Utils.BigNumber.make(5), Utils.BigNumber.make(2))).toEqual([]);

            expect(sortedArray.getStrictlyBetween(Utils.BigNumber.make(35), Utils.BigNumber.make(556))).toEqual([
                Utils.BigNumber.make(555),
            ]);

            expect(sortedArray.getStrictlyBetween(Utils.BigNumber.make(555), Utils.BigNumber.make(1222))).toEqual([]);

            expect(sortedArray.getStrictlyBetween(Utils.BigNumber.make(1), Utils.BigNumber.make(556))).toEqual(bignums);
        });
    });
});
