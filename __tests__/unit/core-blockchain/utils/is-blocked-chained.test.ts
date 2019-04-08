import "jest-extended";

import { interfaces, slots } from "@arkecosystem/crypto";
import { isBlockChained } from "../../../../packages/core-blockchain/src/utils";

describe("isChained", () => {
    it("should be ok", () => {
        const previousBlock = {
            data: {
                id: "1",
                timestamp: slots.getSlotTime(0),
                height: 1,
                previousBlock: null,
            },
        } as interfaces.IBlock;

        const nextBlock = {
            data: {
                id: "2",
                timestamp: slots.getSlotTime(1),
                height: 2,
                previousBlock: "1",
            },
        } as interfaces.IBlock;

        expect(isBlockChained(previousBlock, nextBlock)).toBeTrue();
    });

    it("should not chain when previous block does not match", () => {
        const previousBlock = {
            data: {
                id: "2",
                timestamp: slots.getSlotTime(0),
                height: 2,
                previousBlock: null,
            },
        } as interfaces.IBlock;

        const nextBlock = {
            data: {
                id: "1",
                timestamp: slots.getSlotTime(1),
                height: 3,
                previousBlock: "1",
            },
        } as interfaces.IBlock;

        expect(isBlockChained(previousBlock, nextBlock)).toBeFalse();
    });

    it("should not chain when next height is not plus 1", () => {
        const previousBlock = {
            data: {
                id: "1",
                timestamp: slots.getSlotTime(0),
                height: 1,
                previousBlock: null,
            },
        } as interfaces.IBlock;

        const nextBlock = {
            data: {
                id: "2",
                timestamp: slots.getSlotTime(1),
                height: 3,
                previousBlock: "1",
            },
        } as interfaces.IBlock;

        expect(isBlockChained(previousBlock, nextBlock)).toBeFalse();
    });

    it("should not chain when same slot", () => {
        const previousBlock = {
            data: {
                id: "1",
                timestamp: slots.getSlotTime(0),
                height: 1,
                previousBlock: null,
            },
        } as interfaces.IBlock;

        const nextBlock = {
            data: {
                id: "2",
                timestamp: slots.getSlotTime(0),
                height: 3,
                previousBlock: "1",
            },
        } as interfaces.IBlock;

        expect(isBlockChained(previousBlock, nextBlock)).toBeFalse();
    });

    it("should not chain when lower slot", () => {
        const previousBlock = {
            data: {
                id: "1",
                timestamp: slots.getSlotTime(1),
                height: 1,
                previousBlock: null,
            },
        } as interfaces.IBlock;

        const nextBlock = {
            data: {
                id: "2",
                timestamp: slots.getSlotTime(0),
                height: 3,
                previousBlock: "1",
            },
        } as interfaces.IBlock;

        expect(isBlockChained(previousBlock, nextBlock)).toBeFalse();
    });
});
