import "jest-extends";
import { isChained } from "../../src/utils";

describe("isChained", () => {
    it("should be ok", () => {
        const previousBlock = {
            data: {
                id: "1",
                timestamp: 1,
                height: 1,
                previousBlock: null,
            },
        };

        const nextBlock = {
            data: {
                id: "2",
                timestamp: 2,
                height: 2,
                previousBlock: "1",
            },
        };

        expect(isChained(previousBlock, nextBlock)).toBeTrue();
    });

    it("should not be ok", () => {
        const previousBlock = {
            data: {
                id: "2",
                timestamp: 2,
                height: 2,
                previousBlock: null,
            },
        };

        const nextBlock = {
            data: {
                id: "1",
                timestamp: 1,
                height: 1,
                previousBlock: "1",
            },
        };

        expect(isChained(previousBlock, nextBlock)).toBeFalse();
    });
});
