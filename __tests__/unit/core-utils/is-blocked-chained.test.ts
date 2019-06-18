import "jest-extended";

import { Crypto, Interfaces } from "@arkecosystem/crypto";
import { isBlockChained } from "../../../packages/core-utils/src";

describe("isChained", () => {
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
            height: 3,
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
            height: 3,
            previousBlock: "1",
        } as Interfaces.IBlockData;

        expect(isBlockChained(previousBlock, nextBlock)).toBeFalse();
    });
});
