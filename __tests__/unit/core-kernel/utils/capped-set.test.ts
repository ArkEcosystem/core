import "jest-extended";

import { CappedSet } from "@packages/core-kernel/src/utils/capped-set";

describe("CappedSet", () => {
    it("basic", () => {
        const cappedSet = new CappedSet<number>();

        cappedSet.add(20);

        expect(cappedSet.has(20)).toBeTrue();
        expect(cappedSet.has(21)).toBeFalse();
    });

    it("overflow", () => {
        const maxSize = 10;
        const cappedSet = new CappedSet<number>(maxSize);

        for (let i = 0; i < 15; i++) {
            cappedSet.add(i);
        }

        for (let i = 0; i < 5; i++) {
            expect(cappedSet.has(i)).toBeFalse();
        }

        for (let i = 5; i < 15; i++) {
            expect(cappedSet.has(i)).toBeTrue();
        }
    });
});
