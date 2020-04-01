import "jest-extended";

import { Slots } from "../../../../packages/crypto/src/crypto/slots";
import { configManager } from "../../../../packages/crypto/src/managers/config";
import { devnet } from "../../../../packages/crypto/src/networks";

describe("Slots", () => {
    beforeEach(() => configManager.setConfig(devnet));

    describe("getTime", () => {
        it("return epoch time as number", () => {
            const result = Slots.getTime(1490101210000);

            expect(result).toBeNumber();
            expect(result).toEqual(10);
        });
    });

    describe("getSlotNumber", () => {
        it("return slot number", () => {
            expect(Slots.getSlotNumber(1)).toBe(0);
            expect(Slots.getSlotNumber(4)).toBe(0);
            expect(Slots.getSlotNumber(7)).toBe(0);

            expect(Slots.getSlotNumber(8)).toBe(1);
            expect(Slots.getSlotNumber(9)).toBe(1);

            expect(Slots.getSlotNumber(10)).toBe(1);

            expect(Slots.getSlotNumber(11)).toBe(1);
            expect(Slots.getSlotNumber(15)).toBe(1);
            expect(Slots.getSlotNumber(16)).toBe(2);

            expect(Slots.getSlotNumber(20)).toBe(2);
            expect(Slots.getSlotNumber(24)).toBe(3);

            expect(Slots.getSlotNumber(10)).toBe(1);
            expect(Slots.getSlotNumber(8000)).toBe(1000);
            expect(Slots.getSlotNumber(15000)).toBe(1875);
            expect(Slots.getSlotNumber(169000)).toBe(21125);
            expect(Slots.getSlotNumber(169001)).toBe(21125);
            expect(Slots.getSlotNumber(169005)).toBe(21125);
            expect(Slots.getSlotNumber(169007)).toBe(21125);
        });
    });

    describe("getSlotTime", () => {
        it("returns slot time", () => {
            expect(Slots.getSlotTime(1)).toBe(8);
            expect(Slots.getSlotTime(8)).toBe(64);
            expect(Slots.getSlotTime(50)).toBe(400);
            expect(Slots.getSlotTime(8888)).toBe(71104);
            expect(Slots.getSlotTime(19614)).toBe(156912);
            expect(Slots.getSlotTime(19700)).toBe(157600);
            expect(Slots.getSlotTime(169000)).toBe(1352000);
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

        it("returns true when over half the time in the block remains", () => {
            expect(Slots.isForgingAllowed(0)).toBeTrue();
            expect(Slots.isForgingAllowed(1)).toBeTrue();
            expect(Slots.isForgingAllowed(3)).toBeTrue();
            expect(Slots.isForgingAllowed(8)).toBeTrue();
            expect(Slots.isForgingAllowed(16)).toBeTrue();
        });

        it("returns false when under half the time in the block remains", () => {
            expect(Slots.isForgingAllowed(4)).toBeFalse();
            expect(Slots.isForgingAllowed(5)).toBeFalse();
            expect(Slots.isForgingAllowed(6)).toBeFalse();
            expect(Slots.isForgingAllowed(7)).toBeFalse();
            expect(Slots.isForgingAllowed(15)).toBeFalse();
        });
    });

    describe("getTimeInMsUntilNextSlot", () => {
        it("should be ok", () => {
            const nextSlotTime = Slots.getSlotTime(Slots.getNextSlot());
            const now = Slots.getTime();

            expect(Slots.getTimeInMsUntilNextSlot()).toEqual((nextSlotTime - now) * 1000);
        });
    });

    describe("Dynamic block times", () => {
        it("getSlotNumber", () => {
            const milestones = [
                { height: 1, blocktime: 9 },
                { height: 3, blocktime: 8 },
                { height: 4, blocktime: 5 },
            ];
            const config = { ...devnet, milestones };
            configManager.setConfig(config);

            expect(Slots.getSlotNumber(1)).toBe(0);
            expect(Slots.getSlotNumber(8)).toBe(0);

            expect(Slots.getSlotNumber(9)).toBe(1);
            expect(Slots.getSlotNumber(17)).toBe(1);

            expect(Slots.getSlotNumber(18)).toBe(2);
            expect(Slots.getSlotNumber(25)).toBe(2);

            expect(Slots.getSlotNumber(26)).toBe(3);
            expect(Slots.getSlotNumber(30)).toBe(3);

            expect(Slots.getSlotNumber(31)).toBe(4);
            expect(Slots.getSlotNumber(35)).toBe(4);

            expect(Slots.getSlotNumber(36)).toBe(5);
        });

        it("getSlotTime", () => {
            const milestones = [
                { height: 1, blocktime: 8 },
                { height: 3, blocktime: 9 },
                { height: 6, blocktime: 10 },
            ];
            const config = { ...devnet, milestones };
            configManager.setConfig(config);

            expect(Slots.getSlotTime(1)).toBe(8);
            expect(Slots.getSlotTime(2)).toBe(16);
            expect(Slots.getSlotTime(3)).toBe(25);
            expect(Slots.getSlotTime(4)).toBe(34);
            expect(Slots.getSlotTime(5)).toBe(43);
            expect(Slots.getSlotTime(6)).toBe(53);
            expect(Slots.getSlotTime(7)).toBe(63);
            expect(Slots.getSlotTime(8)).toBe(71);
        });

        describe("isForgingAllowed", () => {
            it("returns true when over half the time in the block remains", () => {
                const milestones = [
                    { height: 1, blocktime: 8 },
                    { height: 3, blocktime: 7 },
                    { height: 4, blocktime: 5 },
                ];
                const config = { ...devnet, milestones };
                configManager.setConfig(config);

                expect(Slots.isForgingAllowed(0)).toBeTrue();
                expect(Slots.isForgingAllowed(1)).toBeTrue();
                expect(Slots.isForgingAllowed(3)).toBeTrue();
                expect(Slots.isForgingAllowed(8)).toBeTrue();
                expect(Slots.isForgingAllowed(11)).toBeTrue();
                expect(Slots.isForgingAllowed(16)).toBeTrue();
                expect(Slots.isForgingAllowed(18)).toBeTrue();
                expect(Slots.isForgingAllowed(23)).toBeTrue();
                expect(Slots.isForgingAllowed(28)).toBeTrue();
                expect(Slots.isForgingAllowed(29)).toBeTrue();
            });

            it("returns false when under half the time in the block remains", () => {
                const milestones = [
                    { height: 1, blocktime: 8 },
                    { height: 3, blocktime: 7 },
                    { height: 4, blocktime: 5 },
                ];
                const config = { ...devnet, milestones };
                configManager.setConfig(config);

                expect(Slots.isForgingAllowed(4)).toBeFalse();
                expect(Slots.isForgingAllowed(5)).toBeFalse();
                expect(Slots.isForgingAllowed(6)).toBeFalse();
                expect(Slots.isForgingAllowed(7)).toBeFalse();
                expect(Slots.isForgingAllowed(12)).toBeFalse();
                expect(Slots.isForgingAllowed(15)).toBeFalse();
                expect(Slots.isForgingAllowed(19)).toBeFalse();
                expect(Slots.isForgingAllowed(22)).toBeFalse();
                expect(Slots.isForgingAllowed(25)).toBeFalse();
                expect(Slots.isForgingAllowed(26)).toBeFalse();
                expect(Slots.isForgingAllowed(27)).toBeFalse();
                expect(Slots.isForgingAllowed(30)).toBeFalse();
                expect(Slots.isForgingAllowed(32)).toBeFalse();
            });
        });
    });
});
