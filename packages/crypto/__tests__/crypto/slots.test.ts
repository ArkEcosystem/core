import "jest-extended";

import { slots } from "../../src/crypto/slots";
import { configManager } from "../../src/managers/config";
import { devnet } from "../../src/networks";

beforeEach(() => configManager.setConfig(devnet));

describe("Slots", () => {
    describe("getHeight", () => {
        it("should return the set height", () => {
            expect(slots.getHeight()).toBe(1);
        });
    });

    describe("setHeight", () => {
        it("should set the height", () => {
            slots.setHeight(123);

            expect(slots.getHeight()).toBe(123);
        });
    });

    describe("resetHeight", () => {
        it("should reset the height", () => {
            slots.setHeight(123);

            expect(slots.getHeight()).toBe(123);

            slots.resetHeight();

            expect(slots.getHeight()).toBe(1);
        });
    });

    describe("getEpochTime", () => {
        it("return epoch datetime", () => {
            expect(slots.getEpochTime()).toBeNumber();
        });
    });

    describe("beginEpochTime", () => {
        it("return epoch datetime", () => {
            expect(slots.beginEpochTime().toISOString()).toBe("2017-03-21T13:00:00.000Z");
        });

        it("return epoch unix", () => {
            expect(slots.beginEpochTime().unix()).toBe(1490101200);
        });
    });

    describe("getTime", () => {
        it("return epoch time as number", () => {
            const result = slots.getTime(1490101210000);

            expect(result).toBeNumber();
            expect(result).toEqual(10);
        });
    });

    describe("getRealTime", () => {
        it("return return real time", () => {
            expect(slots.getRealTime(10)).toBe(1490101210000);
        });
    });

    describe("getSlotNumber", () => {
        it("return slot number", () => {
            expect(slots.getSlotNumber(10)).toBe(1);
        });
    });

    describe("getSlotTime", () => {
        it("returns slot time", () => {
            expect(slots.getSlotTime(19614)).toBe(156912);
        });
    });

    describe("getNextSlot", () => {
        it("returns next slot", () => {
            expect(slots.getNextSlot()).toBeNumber();
        });
    });

    describe("getLastSlot", () => {
        it("returns last slot", () => {
            expect(slots.getLastSlot(1)).toBe(52);
        });
    });

    describe("isForgingAllowed", () => {
        it("returns boolean", () => {
            expect(slots.isForgingAllowed()).toBeDefined();
        });
    });
});
