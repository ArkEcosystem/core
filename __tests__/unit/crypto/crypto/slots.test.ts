import "jest-extended";

import { Slots } from "../../../../packages/crypto/src/crypto/slots";
import { configManager } from "../../../../packages/crypto/src/managers/config";
import { devnet } from "../../../../packages/crypto/src/networks";

afterEach(() => jest.clearAllMocks());

describe("Slots", () => {
    beforeEach(() => configManager.setConfig(devnet));

    describe("Fixed block times", () => {
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
                const spyGetTime = jest.spyOn(Slots, "getTime");
                spyGetTime.mockReturnValue(200);

                const nextSlotTime = Slots.getSlotTime(Slots.getNextSlot());
                const now = Slots.getTime();

                expect(Slots.getTimeInMsUntilNextSlot()).toEqual((nextSlotTime - now) * 1000);
            });
        });
    });

    describe("Dynamic block times", () => {
        describe("getSlotNumber", () => {
            it("should return the correct slot number given a timestamp when no height is passed", () => {
                const milestones = [
                    { height: 1, blocktime: 8 },
                    { height: 2, blocktime: 4 },
                    { height: 4, blocktime: 3 },
                    { height: 6, blocktime: 4 },
                ];
                const config = { ...devnet, milestones };
                configManager.setConfig(config);

                expect(Slots.getSlotNumber(0)).toBe(0);
                expect(Slots.getSlotNumber(7)).toBe(0);

                expect(Slots.getSlotNumber(8)).toBe(1);
                expect(Slots.getSlotNumber(11)).toBe(1);

                expect(Slots.getSlotNumber(12)).toBe(2);
                expect(Slots.getSlotNumber(15)).toBe(2);

                expect(Slots.getSlotNumber(16)).toBe(3);
                expect(Slots.getSlotNumber(18)).toBe(3);

                expect(Slots.getSlotNumber(19)).toBe(4);
                expect(Slots.getSlotNumber(21)).toBe(4);

                expect(Slots.getSlotNumber(22)).toBe(5);
                expect(Slots.getSlotNumber(25)).toBe(5);

                expect(Slots.getSlotNumber(26)).toBe(6);
                expect(Slots.getSlotNumber(29)).toBe(6);
            });

            it("should return the correct slot number given a timestamp within a known height", () => {
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

                // when the height is known

                expect(Slots.getSlotNumber(1, 1)).toBe(0);
                expect(Slots.getSlotNumber(8, 1)).toBe(0);

                expect(Slots.getSlotNumber(9, 2)).toBe(1);
                expect(Slots.getSlotNumber(17, 2)).toBe(1);

                expect(Slots.getSlotNumber(18, 3)).toBe(2);
                expect(Slots.getSlotNumber(25, 3)).toBe(2);

                expect(Slots.getSlotNumber(26, 4)).toBe(3);
                expect(Slots.getSlotNumber(30, 4)).toBe(3);

                expect(Slots.getSlotNumber(31, 5)).toBe(4);
                expect(Slots.getSlotNumber(35, 5)).toBe(4);

                expect(Slots.getSlotNumber(36, 6)).toBe(5);
            });

            it("should get correct slot time when last height is correctly set", () => {
                const milestones = [
                    { height: 1, blocktime: 9 },
                    { height: 3, blocktime: 8 },
                    { height: 4, blocktime: 5 },
                ];
                const config = { ...devnet, milestones };
                configManager.setConfig(config);

                expect(Slots.getSlotNumber(36)).toBe(5);
                expect(Slots.getSlotNumber(38)).toBe(5);
                expect(Slots.getSlotNumber(40)).toBe(5);
                expect(Slots.getSlotNumber(41)).toBe(6);
                expect(Slots.getSlotNumber(45)).toBe(6);
                expect(Slots.getSlotNumber(46)).toBe(7);
                expect(Slots.getSlotNumber(51)).toBe(8);
                expect(Slots.getSlotNumber(96)).toBe(17);
            });

            it("should get correct slot time in future when current block is arbitarily set", () => {
                const milestones = [
                    { height: 1, blocktime: 10 },
                    { height: 10, blocktime: 8 },
                ];
                const config = { ...devnet, milestones };
                configManager.setConfig(config);
                configManager.setHeight(8);
                expect(Slots.getSlotNumber(0)).toBe(0);
                expect(Slots.getSlotNumber(9)).toBe(0);
                expect(Slots.getSlotNumber(10)).toBe(1);
                expect(Slots.getSlotNumber(90)).toBe(9);
                expect(Slots.getSlotNumber(98)).toBe(10);
                expect(Slots.getSlotNumber(106)).toBe(11);
                expect(Slots.getSlotNumber(114)).toBe(12);
                expect(Slots.getSlotNumber(162)).toBe(18);
            });

            it("should throw an error if the provided timestamp is in a slot greater than one provided given the known height", () => {
                const milestones = [
                    { height: 1, blocktime: 9 },
                    { height: 3, blocktime: 8 },
                    { height: 4, blocktime: 5 },
                ];
                const config = { ...devnet, milestones };
                configManager.setConfig(config);

                expect(() => Slots.getSlotNumber(25, 2)).toThrow(`Given timestamp exists in a future block`);
            });

            it("should throw an error if the provided timestamp is in a slot lower than the provided height", () => {
                const milestones = [
                    { height: 1, blocktime: 9 },
                    { height: 3, blocktime: 8 },
                    { height: 4, blocktime: 5 },
                ];
                const config = { ...devnet, milestones };
                configManager.setConfig(config);

                expect(() => Slots.getSlotNumber(25, 4)).toThrow(`Given timestamp exists in a previous block`);
            });
        });

        describe("getSlotTime", () => {
            it("getSlotTime", () => {
                const milestones = [
                    { height: 1, blocktime: 8 },
                    { height: 3, blocktime: 9 },
                    { height: 6, blocktime: 10 },
                    { height: 8, blocktime: 8 },
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
                expect(Slots.getSlotTime(14)).toBe(119);
            });
        });

        describe("getSlotInfo", () => {
            it("should correctly return the slot start time for any given timestamp", () => {
                const milestones = [
                    { height: 1, blocktime: 8 },
                    { height: 2, blocktime: 4 },
                    { height: 4, blocktime: 3 },
                    { height: 6, blocktime: 4 },
                ];
                const config = { ...devnet, milestones };
                configManager.setConfig(config);

                // expect(Slots.getSlotInfo(0).startTime).toBe(0);
                // expect(Slots.getSlotInfo(7).startTime).toBe(0);

                // expect(Slots.getSlotInfo(8).startTime).toBe(8);
                // expect(Slots.getSlotInfo(11).startTime).toBe(8);

                // expect(Slots.getSlotInfo(12).startTime).toBe(12);
                // expect(Slots.getSlotInfo(15).startTime).toBe(12);

                // expect(Slots.getSlotInfo(16).startTime).toBe(16);
                // expect(Slots.getSlotInfo(18).startTime).toBe(16);

                // expect(Slots.getSlotInfo(19).startTime).toBe(19);
                // expect(Slots.getSlotInfo(21).startTime).toBe(19);

                // expect(Slots.getSlotInfo(22).startTime).toBe(22);
                // expect(Slots.getSlotInfo(25).startTime).toBe(22);

                // expect(Slots.getSlotInfo(26).startTime).toBe(26);
                // expect(Slots.getSlotInfo(29).startTime).toBe(26);
            });

            it("should correctly return the slot end time for any given timestamp", () => {
                const milestones = [
                    { height: 1, blocktime: 8 },
                    { height: 2, blocktime: 4 },
                    { height: 4, blocktime: 3 },
                    { height: 6, blocktime: 4 },
                ];
                const config = { ...devnet, milestones };
                configManager.setConfig(config);

                // expect(Slots.getSlotInfo(0).endTime).toBe(7);
                // expect(Slots.getSlotInfo(7).endTime).toBe(7);

                // expect(Slots.getSlotInfo(8).endTime).toBe(11);
                // expect(Slots.getSlotInfo(11).endTime).toBe(11);

                // expect(Slots.getSlotInfo(12).endTime).toBe(15);
                // expect(Slots.getSlotInfo(15).endTime).toBe(15);

                // expect(Slots.getSlotInfo(16).endTime).toBe(18);
                // expect(Slots.getSlotInfo(18).endTime).toBe(18);

                // expect(Slots.getSlotInfo(19).endTime).toBe(21);
                // expect(Slots.getSlotInfo(21).endTime).toBe(21);

                // expect(Slots.getSlotInfo(22).endTime).toBe(25);
                // expect(Slots.getSlotInfo(25).endTime).toBe(25);

                // expect(Slots.getSlotInfo(26).endTime).toBe(29);
                // expect(Slots.getSlotInfo(29).endTime).toBe(29);
            });

            it("should correctly return the slot block time for any given timestamp", () => {
                const milestones = [
                    { height: 1, blocktime: 8 },
                    { height: 2, blocktime: 4 },
                    { height: 4, blocktime: 3 },
                    { height: 6, blocktime: 4 },
                ];
                const config = { ...devnet, milestones };
                configManager.setConfig(config);

                // expect(Slots.getSlotInfo(0).blockTime).toBe(8);
                // expect(Slots.getSlotInfo(7).blockTime).toBe(8);

                // expect(Slots.getSlotInfo(8).blockTime).toBe(4);
                // expect(Slots.getSlotInfo(11).blockTime).toBe(4);

                // expect(Slots.getSlotInfo(12).blockTime).toBe(4);
                // expect(Slots.getSlotInfo(15).blockTime).toBe(4);

                // expect(Slots.getSlotInfo(16).blockTime).toBe(3);
                // expect(Slots.getSlotInfo(18).blockTime).toBe(3);

                // expect(Slots.getSlotInfo(19).blockTime).toBe(3);
                // expect(Slots.getSlotInfo(21).blockTime).toBe(3);

                // expect(Slots.getSlotInfo(22).blockTime).toBe(4);
                // expect(Slots.getSlotInfo(25).blockTime).toBe(4);

                // expect(Slots.getSlotInfo(26).blockTime).toBe(4);
                // expect(Slots.getSlotInfo(29).blockTime).toBe(4);
            });
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

    describe("Missed slots", () => {
        describe("calculateSlotTime", () => {
            it("should calculate the slot time correctly when slots have been missed", () => {
                const milestones = [
                    { height: 1, blocktime: 4 },
                    { height: 4, blocktime: 3 },
                    { height: 7, blocktime: 4 },
                ];
                const config = { ...devnet, milestones };
                configManager.setConfig(config);

                // TODO: check that the blockTimestamp uses the start time of a given slot
                const blockdata = [
                    { height: 1, timestamp: 0 },
                    { height: 3, timestamp: 16 },
                    { height: 6, timestamp: 29 },
                ];

                const getTimeStampForBlock = (height: number) => {
                    switch (height) {
                        case blockdata[0].height:
                            return blockdata[0].timestamp;
                        case blockdata[1].height:
                            return blockdata[1].timestamp;
                        case blockdata[2].height:
                            return blockdata[2].timestamp;
                        default:
                            throw new Error(`Test scenarios should not hit this line`);
                    }
                };

                expect(Slots.getSlotTime(0, 1, getTimeStampForBlock)).toEqual(0);
                expect(Slots.getSlotTime(1, 2, getTimeStampForBlock)).toEqual(4);
                expect(Slots.getSlotTime(2, 3, getTimeStampForBlock)).toEqual(8);
                expect(Slots.getSlotTime(3, 3, getTimeStampForBlock)).toEqual(12);
                expect(Slots.getSlotTime(4, 3, getTimeStampForBlock)).toEqual(16);
                expect(Slots.getSlotTime(5, 4, getTimeStampForBlock)).toEqual(20);
                expect(Slots.getSlotTime(6, 5, getTimeStampForBlock)).toEqual(23);
                expect(Slots.getSlotTime(7, 6, getTimeStampForBlock)).toEqual(26);
                expect(Slots.getSlotTime(8, 6, getTimeStampForBlock)).toEqual(29);
                expect(Slots.getSlotTime(9, 7, getTimeStampForBlock)).toEqual(32);
                expect(Slots.getSlotTime(10, 7, getTimeStampForBlock)).toEqual(36);
                expect(Slots.getSlotTime(11, 8, getTimeStampForBlock)).toEqual(40);
            });
        });

        describe("getSlotInfo", () => {
            it("should calculate the next slot correctly when slots have been missed", () => {
                const milestones = [
                    { height: 1, blocktime: 4 },
                    { height: 4, blocktime: 3 },
                    { height: 7, blocktime: 4 },
                ];
                const config = { ...devnet, milestones };
                configManager.setConfig(config);

                // TODO: check that the blockTimestamp uses the start time of a given slot
                const blockdata = [
                    { height: 1, timestamp: 0 },
                    { height: 3, timestamp: 16 },
                    { height: 6, timestamp: 29 },
                ];

                const getTimeStampForBlock = (height: number) => {
                    // console.log("Looking up height: ", height);
                    switch (height) {
                        case blockdata[0].height:
                            return blockdata[0].timestamp;
                        case blockdata[1].height:
                            return blockdata[1].timestamp;
                        case blockdata[2].height:
                            return blockdata[2].timestamp;
                        default:
                            throw new Error(`Test scenarios should not hit this line`);
                    }
                };

                expect(Slots.getSlotInfo(0, 1, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 0,
                        endTime: 3,
                        slotNumber: 0,
                        forgingStatus: true,
                    }),
                );
                expect(Slots.getSlotInfo(1, 1, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 0,
                        endTime: 3,
                        slotNumber: 0,
                        forgingStatus: true,
                    }),
                );
                expect(Slots.getSlotInfo(2, 1, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 0,
                        endTime: 3,
                        slotNumber: 0,
                        forgingStatus: false,
                    }),
                );
                expect(Slots.getSlotInfo(3, 1, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 0,
                        endTime: 3,
                        slotNumber: 0,
                        forgingStatus: false,
                    }),
                );

                expect(Slots.getSlotInfo(4, 2, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 4,
                        endTime: 7,
                        slotNumber: 1,
                    }),
                );
                expect(Slots.getSlotInfo(7, 2, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 4,
                        endTime: 7,
                        slotNumber: 1,
                    }),
                );

                expect(Slots.getSlotInfo(8, 3, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 8,
                        endTime: 11,
                        slotNumber: 2,
                    }),
                );
                expect(Slots.getSlotInfo(11, 3, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 8,
                        endTime: 11,
                        slotNumber: 2,
                    }),
                );

                expect(Slots.getSlotInfo(12, 3, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 12,
                        endTime: 15,
                        slotNumber: 3,
                    }),
                );
                expect(Slots.getSlotInfo(15, 3, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 12,
                        endTime: 15,
                        slotNumber: 3,
                    }),
                );

                expect(Slots.getSlotInfo(16, 3, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 16,
                        endTime: 19,
                        slotNumber: 4,
                    }),
                );
                expect(Slots.getSlotInfo(19, 3, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 16,
                        endTime: 19,
                        slotNumber: 4,
                    }),
                );

                expect(Slots.getSlotInfo(20, 4, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 20,
                        endTime: 22,
                        slotNumber: 5,
                    }),
                );
                expect(Slots.getSlotInfo(22, 4, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 20,
                        endTime: 22,
                        slotNumber: 5,
                    }),
                );

                expect(Slots.getSlotInfo(23, 5, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 23,
                        endTime: 25,
                        slotNumber: 6,
                    }),
                );
                expect(Slots.getSlotInfo(25, 5, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 23,
                        endTime: 25,
                        slotNumber: 6,
                    }),
                );

                expect(Slots.getSlotInfo(26, 6, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 26,
                        endTime: 28,
                        slotNumber: 7,
                    }),
                );
                expect(Slots.getSlotInfo(28, 6, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 26,
                        endTime: 28,
                        slotNumber: 7,
                    }),
                );

                expect(Slots.getSlotInfo(29, 6, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 29,
                        endTime: 31,
                        slotNumber: 8,
                    }),
                );
                expect(Slots.getSlotInfo(31, 6, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 29,
                        endTime: 31,
                        slotNumber: 8,
                    }),
                );

                expect(Slots.getSlotInfo(32, 7, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 32,
                        endTime: 35,
                        slotNumber: 9,
                    }),
                );
                expect(Slots.getSlotInfo(35, 7, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 32,
                        endTime: 35,
                        slotNumber: 9,
                    }),
                );

                expect(Slots.getSlotInfo(36, 7, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 36,
                        endTime: 39,
                        slotNumber: 10,
                    }),
                );
                expect(Slots.getSlotInfo(39, 7, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 36,
                        endTime: 39,
                        slotNumber: 10,
                    }),
                );

                expect(Slots.getSlotInfo(40, 8, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 40,
                        endTime: 43,
                        slotNumber: 11,
                        forgingStatus: true,
                    }),
                );
                expect(Slots.getSlotInfo(41, 8, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 40,
                        endTime: 43,
                        slotNumber: 11,
                        forgingStatus: true,
                    }),
                );
                expect(Slots.getSlotInfo(42, 8, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 40,
                        endTime: 43,
                        slotNumber: 11,
                        forgingStatus: false,
                    }),
                );
                expect(Slots.getSlotInfo(43, 8, getTimeStampForBlock)).toEqual(
                    expect.objectContaining({
                        startTime: 40,
                        endTime: 43,
                        slotNumber: 11,
                        forgingStatus: false,
                    }),
                );
            });
        });
    });
});
