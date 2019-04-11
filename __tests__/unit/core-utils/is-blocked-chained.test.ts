import "jest-extended";

import { Crypto, Interfaces } from "@arkecosystem/crypto";
import { isBlockChained } from "../../../packages/core-utils/src";

describe("isChained", () => {
    it("should be ok", () => {
        const previousBlock = {
            data: {
                id: "1",
                timestamp: Crypto.slots.getSlotTime(0),
                height: 1,
                previousBlock: null,
            },
        } as Interfaces.IBlock;

        const nextBlock = {
            data: {
                id: "2",
                timestamp: Crypto.slots.getSlotTime(1),
                height: 2,
                previousBlock: "1",
            },
        } as Interfaces.IBlock;

        expect(isBlockChained(previousBlock, nextBlock)).toBeTrue();
    });

    it("should not chain when previous block does not match", () => {
        const previousBlock = {
            data: {
                id: "2",
                timestamp: Crypto.slots.getSlotTime(0),
                height: 2,
                previousBlock: null,
            },
        } as Interfaces.IBlock;

        const nextBlock = {
            data: {
                id: "1",
                timestamp: Crypto.slots.getSlotTime(1),
                height: 3,
                previousBlock: "1",
            },
        } as Interfaces.IBlock;

        expect(isBlockChained(previousBlock, nextBlock)).toBeFalse();
    });

    it("should not chain when next height is not plus 1", () => {
        const previousBlock = {
            data: {
                id: "1",
                timestamp: Crypto.slots.getSlotTime(0),
                height: 1,
                previousBlock: null,
            },
        } as Interfaces.IBlock;

        const nextBlock = {
            data: {
                id: "2",
                timestamp: Crypto.slots.getSlotTime(1),
                height: 3,
                previousBlock: "1",
            },
        } as Interfaces.IBlock;

        expect(isBlockChained(previousBlock, nextBlock)).toBeFalse();
    });

    it("should not chain when same slot", () => {
        const previousBlock = {
            data: {
                id: "1",
                timestamp: Crypto.slots.getSlotTime(0),
                height: 1,
                previousBlock: null,
            },
        } as Interfaces.IBlock;

        const nextBlock = {
            data: {
                id: "2",
                timestamp: Crypto.slots.getSlotTime(0),
                height: 3,
                previousBlock: "1",
            },
        } as Interfaces.IBlock;

        expect(isBlockChained(previousBlock, nextBlock)).toBeFalse();
    });

    it("should not chain when lower slot", () => {
        const previousBlock = {
            data: {
                id: "1",
                timestamp: Crypto.slots.getSlotTime(1),
                height: 1,
                previousBlock: null,
            },
        } as Interfaces.IBlock;

        const nextBlock = {
            data: {
                id: "2",
                timestamp: Crypto.slots.getSlotTime(0),
                height: 3,
                previousBlock: "1",
            },
        } as Interfaces.IBlock;

        expect(isBlockChained(previousBlock, nextBlock)).toBeFalse();
    });
});
