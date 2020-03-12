import "jest-extended";

import { Crypto, Interfaces } from "@arkecosystem/crypto";
import { getBlockNotChainedErrorMessage, isBlockChained } from "@packages/core-kernel/src/utils/is-block-chained";

describe("isBlockChained", () => {
    it("should be ok", () => {
        const previousBlock = {
            id: "1",
            timestamp: Crypto.Slots.getSlotTime(0),
            height: 1,
            previousBlock: null,
        } as Interfaces.IBlockData;

        const nextBlock = {
            id: "2",
            timestamp: Crypto.Slots.getSlotTime(1),
            height: 2,
            previousBlock: "1",
        } as Interfaces.IBlockData;

        expect(isBlockChained(previousBlock, nextBlock)).toBeTrue();
    });

    it("should not chain when previous block does not match", () => {
        const previousBlock = {
            id: "2",
            timestamp: Crypto.Slots.getSlotTime(0),
            height: 2,
            previousBlock: null,
        } as Interfaces.IBlockData;

        const nextBlock = {
            id: "1",
            timestamp: Crypto.Slots.getSlotTime(1),
            height: 3,
            previousBlock: "1",
        } as Interfaces.IBlockData;

        expect(isBlockChained(previousBlock, nextBlock)).toBeFalse();
    });

    it("should not chain when next height is not plus 1", () => {
        const previousBlock = {
            id: "1",
            timestamp: Crypto.Slots.getSlotTime(0),
            height: 1,
            previousBlock: null,
        } as Interfaces.IBlockData;

        const nextBlock = {
            id: "2",
            timestamp: Crypto.Slots.getSlotTime(1),
            height: 3,
            previousBlock: "1",
        } as Interfaces.IBlockData;

        expect(isBlockChained(previousBlock, nextBlock)).toBeFalse();
    });

    it("should not chain when same slot", () => {
        const previousBlock = {
            id: "1",
            timestamp: Crypto.Slots.getSlotTime(0),
            height: 1,
            previousBlock: null,
        } as Interfaces.IBlockData;

        const nextBlock = {
            id: "2",
            timestamp: Crypto.Slots.getSlotTime(0),
            height: 2,
            previousBlock: "1",
        } as Interfaces.IBlockData;

        expect(isBlockChained(previousBlock, nextBlock)).toBeFalse();
    });

    it("should not chain when lower slot", () => {
        const previousBlock = {
            id: "1",
            timestamp: Crypto.Slots.getSlotTime(1),
            height: 1,
            previousBlock: null,
        } as Interfaces.IBlockData;

        const nextBlock = {
            id: "2",
            timestamp: Crypto.Slots.getSlotTime(0),
            height: 2,
            previousBlock: "1",
        } as Interfaces.IBlockData;

        expect(isBlockChained(previousBlock, nextBlock)).toBeFalse();
    });
});

describe("getBlockNotChainedErrorMessage", () => {
    it("should throw when blocks are chained", () => {
        const previousBlock = {
            id: "1",
            timestamp: Crypto.Slots.getSlotTime(0),
            height: 1,
            previousBlock: null,
        } as Interfaces.IBlockData;

        const nextBlock = {
            id: "2",
            timestamp: Crypto.Slots.getSlotTime(1),
            height: 2,
            previousBlock: "1",
        } as Interfaces.IBlockData;

        const check = () => getBlockNotChainedErrorMessage(previousBlock, nextBlock);

        expect(check).toThrow();
    });

    it("should report when previous block id does not match", () => {
        const previousBlock = {
            id: "2",
            timestamp: Crypto.Slots.getSlotTime(0),
            height: 2,
            previousBlock: null,
        } as Interfaces.IBlockData;

        const nextBlock = {
            id: "1",
            timestamp: Crypto.Slots.getSlotTime(1),
            height: 3,
            previousBlock: "1",
        } as Interfaces.IBlockData;

        const msg = getBlockNotChainedErrorMessage(previousBlock, nextBlock);

        expect(msg).toBe(
            "Block { height: 3, id: 1, previousBlock: 1 } is not chained to the previous block { height: 2, id: 2 }: previous block id mismatch",
        );
    });

    it("should report when next height is not plus 1", () => {
        const previousBlock = {
            id: "1",
            timestamp: Crypto.Slots.getSlotTime(0),
            height: 1,
            previousBlock: null,
        } as Interfaces.IBlockData;

        const nextBlock = {
            id: "2",
            timestamp: Crypto.Slots.getSlotTime(1),
            height: 3,
            previousBlock: "1",
        } as Interfaces.IBlockData;

        const msg = getBlockNotChainedErrorMessage(previousBlock, nextBlock);

        expect(msg).toBe(
            "Block { height: 3, id: 2, previousBlock: 1 } is not chained to the previous block { height: 1, id: 1 }: height is not plus one",
        );
    });

    it("should not chain when same slot", () => {
        const previousBlock = {
            id: "1",
            timestamp: Crypto.Slots.getSlotTime(0),
            height: 1,
            previousBlock: null,
        } as Interfaces.IBlockData;

        const nextBlock = {
            id: "2",
            timestamp: Crypto.Slots.getSlotTime(0),
            height: 2,
            previousBlock: "1",
        } as Interfaces.IBlockData;

        const msg = getBlockNotChainedErrorMessage(previousBlock, nextBlock);

        expect(msg).toBe(
            "Block { height: 2, id: 2, previousBlock: 1 } is not chained to the previous block { height: 1, id: 1 }: previous slot is not smaller: 0 (derived from timestamp 0) VS 0 (derived from timestamp 0)",
        );
    });

    it("should not chain when lower slot", () => {
        const previousBlock = {
            id: "1",
            timestamp: Crypto.Slots.getSlotTime(1),
            height: 1,
            previousBlock: null,
        } as Interfaces.IBlockData;

        const nextBlock = {
            id: "2",
            timestamp: Crypto.Slots.getSlotTime(0),
            height: 2,
            previousBlock: "1",
        } as Interfaces.IBlockData;

        const msg = getBlockNotChainedErrorMessage(previousBlock, nextBlock);

        expect(msg).toBe(
            "Block { height: 2, id: 2, previousBlock: 1 } is not chained to the previous block { height: 1, id: 1 }: previous slot is not smaller: 1 (derived from timestamp 8) VS 0 (derived from timestamp 0)",
        );
    });
});
