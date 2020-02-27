import "jest-extended";

import { Slots } from "../../../../packages/crypto/src/crypto/slots";
import { configManager } from "../../../../packages/crypto/src/managers/config";
import { devnet } from "../../../../packages/crypto/src/networks";

beforeEach(() => configManager.setConfig(devnet));

describe("Slots", () => {
    describe("getTime", () => {
        it("return epoch time as number", () => {
            const result = Slots.getTime(1490101210000);

            expect(result).toBeNumber();
            expect(result).toEqual(10);
        });
    });

    describe("getSlotNumber", () => {
        it("return slot number", () => {
            expect(Slots.getSlotNumber(10)).toBe(1);
        });
    });

    describe("getSlotTime", () => {
        it("returns slot time", () => {
            expect(Slots.getSlotTime(19614)).toBe(156912);
        });
    });

    describe("getNextSlot", () => {
        it("returns next slot", () => {
            expect(Slots.getNextSlot()).toBeNumber();
        });
    });

    describe("isForgingAllowed", () => {
        it("returns boolean", () => {
            expect(Slots.isForgingAllowed()).toBeDefined();
        });
    });

    describe("getTimeInMsUntilNextSlot", () => {
        it("should be ok", () => {
            const nextSlotTime = Slots.getSlotTime(Slots.getNextSlot());
            const now = Slots.getTime();

            expect(Slots.getTimeInMsUntilNextSlot()).toEqual((nextSlotTime - now) * 1000);
        });
    });
});
