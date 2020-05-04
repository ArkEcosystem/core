import { Tree } from "@arkecosystem/core-utils/src/tree";
import { Utils } from "@arkecosystem/crypto";

describe("Tree", () => {
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

    describe("when tree is empty", () => {
        it("should insert the first value in the root node of the tree", () => {
            const tree = new Tree(compareFunction);
            expect(tree.isEmpty()).toBeTrue();

            const valueToInsert = Utils.BigNumber.make(33);
            tree.insert(valueToInsert.toString(), valueToInsert);

            expect(tree.isEmpty()).toBeFalse();

            const expectedTree = {
                values: { [valueToInsert.toString()]: valueToInsert },
                lastValueAdded: valueToInsert,
            };
            expect(tree.toJSON()).toEqual(JSON.stringify(expectedTree, null, 2));
        });

        it("should do nothing when removing any value", () => {
            const tree = new Tree(compareFunction);
            const expectedTree = {
                values: {},
            };
            expect(tree.toJSON()).toEqual(JSON.stringify(expectedTree, null, 2));

            tree.remove("2", Utils.BigNumber.make(2));

            expect(tree.toJSON()).toEqual(JSON.stringify(expectedTree, null, 2));
        });
    });

    describe("when tree has one value", () => {
        it("should get back to empty state when removing the only value", () => {
            const tree = new Tree(compareFunction);
            const expectedEmptyTree = {
                values: {},
            };
            expect(tree.toJSON()).toEqual(JSON.stringify(expectedEmptyTree, null, 2));

            const valueToAddAndRemove = Utils.BigNumber.make(2);
            tree.insert(valueToAddAndRemove.toString(), valueToAddAndRemove);
            const expectedTreeOneValue = {
                values: { [valueToAddAndRemove.toString()]: valueToAddAndRemove },
                lastValueAdded: valueToAddAndRemove,
            };
            expect(tree.toJSON()).toEqual(JSON.stringify(expectedTreeOneValue, null, 2));

            tree.remove(valueToAddAndRemove.toString(), valueToAddAndRemove);

            expect(tree.toJSON()).toEqual(JSON.stringify(expectedEmptyTree, null, 2));
        });

        it("should insert in the right node when the compare function returns more than zero", () => {
            const tree = new Tree(compareFunction);

            const rootValue = Utils.BigNumber.make(43);
            tree.insert(rootValue.toString(), rootValue);
            const expectedTreeOneValue = {
                values: { [rootValue.toString()]: rootValue },
                lastValueAdded: rootValue,
            };
            expect(tree.toJSON()).toEqual(JSON.stringify(expectedTreeOneValue, null, 2));

            const valueGreaterThanRoot = Utils.BigNumber.make(44);
            tree.insert(valueGreaterThanRoot.toString(), valueGreaterThanRoot);
            const expectedTreeTwoValues = {
                values: { [rootValue.toString()]: rootValue },
                lastValueAdded: rootValue,
                right: {
                    values: { [valueGreaterThanRoot.toString()]: valueGreaterThanRoot },
                    lastValueAdded: valueGreaterThanRoot,
                    parent: rootValue.toString(),
                },
            };
            expect(tree.toJSON()).toEqual(JSON.stringify(expectedTreeTwoValues, null, 2));
        });

        it("should insert in the left node when the compare function returns less than zero", () => {
            const tree = new Tree(compareFunction);

            const rootValue = Utils.BigNumber.make(43);
            tree.insert(rootValue.toString(), rootValue);
            const expectedTreeOneValue = {
                values: { [rootValue.toString()]: rootValue },
                lastValueAdded: rootValue,
            };
            expect(tree.toJSON()).toEqual(JSON.stringify(expectedTreeOneValue, null, 2));

            const valueLessThanRoot = Utils.BigNumber.make(42);
            tree.insert(valueLessThanRoot.toString(), valueLessThanRoot);
            const expectedTreeTwoValues = {
                values: { [rootValue.toString()]: rootValue },
                lastValueAdded: rootValue,
                left: {
                    values: { [valueLessThanRoot.toString()]: valueLessThanRoot },
                    lastValueAdded: valueLessThanRoot,
                    parent: rootValue.toString(),
                },
            };
            expect(tree.toJSON()).toEqual(JSON.stringify(expectedTreeTwoValues, null, 2));
        });

        it("should insert in the same node when the compare function returns zero", () => {
            const tree = new Tree(compareFunction);

            const rootValue = Utils.BigNumber.make(43);
            tree.insert(rootValue.toString(), rootValue);
            const expectedTreeOneValue = {
                values: { [rootValue.toString()]: rootValue },
                lastValueAdded: rootValue,
            };
            expect(tree.toJSON()).toEqual(JSON.stringify(expectedTreeOneValue, null, 2));

            const valueEqualsRoot = Utils.BigNumber.make(43);
            const id = "customId";
            // inserting with a different id so that the value is added to the root values
            // it looks weird right now but it makes sense when storing transactions by fee for example, we can
            // have multiple transactions with the same fee, so stored in the same node
            tree.insert(id, valueEqualsRoot);
            const expectedTreeTwoValues = {
                values: { [rootValue.toString()]: rootValue, [id]: valueEqualsRoot },
                lastValueAdded: valueEqualsRoot,
            };
            expect(tree.toJSON()).toEqual(JSON.stringify(expectedTreeTwoValues, null, 2));
        });
    });

    it("should insert, find, remove, and retrieve all data sorted - test on a 1000 item sample", () => {
        const tree = new Tree(compareFunction);

        const bignums: Utils.BigNumber[] = [];
        for (let i = 0; i < 1000; i++) {
            const randomBignum = Utils.BigNumber.make(Math.floor(Math.random() * 1000000));
            if (bignums.find(b => b.isEqualTo(randomBignum))) {
                continue;
            }

            const treeId = randomBignum.toString();
            tree.insert(treeId, randomBignum);
            bignums.push(randomBignum);
        }

        // checking that getAll() returns the bignums sorted just like the classic array sort() function
        expect(tree.getAll()).toEqual([...bignums].sort(compareFunction));

        for (let i = 0; i < bignums.length; i += 10) {
            const treeId = bignums[i].toString();
            const foundFromTree = tree.find(treeId, bignums[i]);
            expect(foundFromTree).toEqual(bignums[i]);
        }

        while (bignums.length) {
            const toRemove = bignums.pop();
            const treeId = toRemove.toString();

            expect(tree.find(treeId, toRemove)).toEqual(toRemove);

            tree.remove(treeId, toRemove);

            expect(tree.getAll()).toEqual([...bignums].sort(compareFunction));
            expect(tree.find(treeId, toRemove)).toBeUndefined();
        }
    });

    describe("getValuesLastToFirst", () => {
        it("should get the values last to first", () => {
            const tree = new Tree(compareFunction);

            const bignums: Utils.BigNumber[] = [];
            for (let i = 0; i < 1000; i++) {
                const randomBignum = Utils.BigNumber.make(Math.floor(Math.random() * 1000000));
                if (bignums.find(b => b.isEqualTo(randomBignum))) {
                    continue;
                }

                const treeId = randomBignum.toString();
                tree.insert(treeId, randomBignum);
                bignums.push(randomBignum);
            }

            // checking that getAll() returns the bignums sorted just like the classic array sort() function
            expect(tree.getValuesLastToFirst(1000)).toEqual([...bignums].sort(compareFunction).reverse());
        });
    });
});
