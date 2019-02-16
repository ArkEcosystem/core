import "./__support__/mocks/core-container";

import { app } from "@arkecosystem/core-container";
import "jest-extended";
import { CappedSet } from "../src/capped-set";

describe("CappedSet", () => {
    it("basic", () => {
        const cappedSet = new CappedSet();

        cappedSet.add(20);

        expect(cappedSet.has(20)).toBe(true);
        expect(cappedSet.has(21)).toBe(false);
    });

    it("overflow", () => {
        const maxSize = 10;
        const cappedSet = new CappedSet(maxSize);

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
