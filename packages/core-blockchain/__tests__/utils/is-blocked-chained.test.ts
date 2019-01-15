import "jest-extended";

import { models } from "@arkecosystem/crypto";
import { isBlockChained } from "../../src/utils";

describe("isChained", () => {
    it("should be ok", () => {
        const previousBlock = {
            data: {
                id: "1",
                timestamp: 1,
                height: 1,
                previousBlock: null,
            },
        } as models.IBlock;

        const nextBlock = {
            data: {
                id: "2",
                timestamp: 2,
                height: 2,
                previousBlock: "1",
            },
        }  as models.IBlock;

        expect(isBlockChained(previousBlock, nextBlock)).toBeTrue();
    });

    it("should not be ok", () => {
        const previousBlock = {
            data: {
                id: "2",
                timestamp: 2,
                height: 2,
                previousBlock: null,
            },
        } as models.IBlock;

        const nextBlock = {
            data: {
                id: "1",
                timestamp: 1,
                height: 1,
                previousBlock: "1",
            },
        } as models.IBlock;

        expect(isBlockChained(previousBlock, nextBlock)).toBeFalse();
    });
});
