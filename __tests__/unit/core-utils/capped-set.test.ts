import "jest-extended";

import "./mocks/core-container";

import { CappedSet } from "../../../packages/core-utils/src/capped-set";

describe("CappedSet", () => {
    it("basic", () => {
        const cappedSet = new CappedSet<number>();

        cappedSet.add(20);

        expect(cappedSet.has(20)).toBe(true);
        expect(cappedSet.has(21)).toBe(false);
    });

    it("overflow", () => {
        const maxSize = 10;
        const cappedSet = new CappedSet<number>(maxSize);

        for (let i = 0; i < 15; i++) {
            cappedSet.add(i);
        }

        for (let i = 0; i < 5; i++) {
            expect(cappedSet.has(i)).toBe(false);
        }

        for (let i = 5; i < 15; i++) {
            expect(cappedSet.has(i)).toBe(true);
        }
    });
});
