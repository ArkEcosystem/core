import "jest-extended";

import { calculateBlockTime, isNewBlockTime } from "@packages/crypto/src/utils/block-time-calculator";

import { configManager } from "../../../../packages/crypto/src/managers/config";
import milestones from "./fixtures/block-time-milestones.json";

beforeEach(() => {
    configManager.set("milestones", milestones);
});

describe("BlockTimeCalculator", () => {
    describe("isNewBlock", () => {
        it("should calculate whether a given round contains a new blocktime", () => {
            expect(isNewBlockTime(1)).toBeTrue();
            expect(isNewBlockTime(10800)).toBeTrue();
            expect(isNewBlockTime(910000)).toBeTrue();
            expect(isNewBlockTime(920000)).toBeTrue();
            expect(isNewBlockTime(950000)).toBeTrue();
        });

        it("should return false is the height is not a new milestone", () => {
            expect(isNewBlockTime(2)).toBeFalse();
            expect(isNewBlockTime(10799)).toBeFalse();
            expect(isNewBlockTime(10801)).toBeFalse();
            expect(isNewBlockTime(960001)).toBeFalse();
        });

        it("should return false when a new milestone doesn't include a new blocktime", async () => {
            expect(isNewBlockTime(21600)).toBeFalse();
            expect(isNewBlockTime(960000)).toBeFalse();
        });

        it("should return false when the milestone includes the same blocktime", async () => {
            expect(isNewBlockTime(910004)).toBeFalse();
        });
    });

    describe("calculateBlockTime", () => {
        it("should calculate the blocktime from a given height", () => {
            expect(calculateBlockTime(1)).toEqual(8);
            expect(calculateBlockTime(10800)).toEqual(9);
            expect(calculateBlockTime(910000)).toEqual(11);

            expect(calculateBlockTime(950000)).toEqual(12);
        });

        it("should calculate blocktime from the last milestone where it was changes", () => {
            expect(isNewBlockTime(21600)).toBeFalse();
            expect(isNewBlockTime(900000)).toBeFalse();
            expect(isNewBlockTime(2)).toBeFalse();
            expect(isNewBlockTime(10799)).toBeFalse();
            expect(isNewBlockTime(970000)).toBeFalse();

            expect(calculateBlockTime(2)).toEqual(8);
            expect(calculateBlockTime(10799)).toEqual(8);

            expect(calculateBlockTime(21600)).toEqual(9);
            expect(calculateBlockTime(900000)).toEqual(9);
            expect(calculateBlockTime(970000)).toEqual(12);
        });

        it("should calculate blocktimes when they reduce to a previously used blocktime", () => {
            expect(isNewBlockTime(920000)).toBeTrue();

            expect(calculateBlockTime(920000)).toEqual(9);
        });

        it("should calculate latest milestone correctly when it doesn't change the blocktime", () => {
            expect(isNewBlockTime(960000)).toBeFalse();
            expect(calculateBlockTime(960000)).toEqual(12);
        });

        it("should throw an error when no blocktimes are specified in any milestones", () => {
            configManager.set("milestones", {});

            expect(isNewBlockTime(960000)).toBeFalse();
            expect(() => calculateBlockTime(960000)).toThrow(`No milestones specifying any height were found`);
        });
    });
});
