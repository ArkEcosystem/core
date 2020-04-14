import "jest-extended";

import { Slots } from "../../../../packages/crypto/src/crypto/slots";
import { configManager } from "../../../../packages/crypto/src/managers/config";
import { devnet } from "../../../../packages/crypto/src/networks";

afterEach(() => jest.clearAllMocks());

describe("Slots", () => {
    const getTimeStampForBlock = (height: number) => {
        switch (height) {
            case 1:
                return 0;
            default:
                throw new Error(`Test scenarios should not hit this line`);
        }
    };

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
                expect(Slots.getSlotNumber(getTimeStampForBlock, 1, 1)).toBe(0);
                expect(Slots.getSlotNumber(getTimeStampForBlock, 4, 1)).toBe(0);
                expect(Slots.getSlotNumber(getTimeStampForBlock, 7, 1)).toBe(0);

                expect(Slots.getSlotNumber(getTimeStampForBlock, 8, 2)).toBe(1);
                expect(Slots.getSlotNumber(getTimeStampForBlock, 9, 2)).toBe(1);
                expect(Slots.getSlotNumber(getTimeStampForBlock, 10, 2)).toBe(1);
                expect(Slots.getSlotNumber(getTimeStampForBlock, 11, 2)).toBe(1);
                expect(Slots.getSlotNumber(getTimeStampForBlock, 15, 2)).toBe(1);
                expect(Slots.getSlotNumber(getTimeStampForBlock, 16, 3)).toBe(2);
                expect(Slots.getSlotNumber(getTimeStampForBlock, 20, 3)).toBe(2);

                expect(Slots.getSlotNumber(getTimeStampForBlock, 24, 4)).toBe(3);

                expect(Slots.getSlotNumber(getTimeStampForBlock, 8000, 1001)).toBe(1000);

                expect(Slots.getSlotNumber(getTimeStampForBlock, 15000, 1876)).toBe(1875);

                expect(Slots.getSlotNumber(getTimeStampForBlock, 169000, 21126)).toBe(21125);
                expect(Slots.getSlotNumber(getTimeStampForBlock, 169001, 21126)).toBe(21125);
                expect(Slots.getSlotNumber(getTimeStampForBlock, 169005, 21126)).toBe(21125);
                expect(Slots.getSlotNumber(getTimeStampForBlock, 169007, 21126)).toBe(21125);
            });
        });

        describe("getSlotTime", () => {
            it("returns slot time", () => {
                expect(Slots.getSlotTime(getTimeStampForBlock, 1, 2)).toBe(8);
                expect(Slots.getSlotTime(getTimeStampForBlock, 8, 9)).toBe(64);
                expect(Slots.getSlotTime(getTimeStampForBlock, 50, 51)).toBe(400);
                expect(Slots.getSlotTime(getTimeStampForBlock, 8888, 8889)).toBe(71104);
                expect(Slots.getSlotTime(getTimeStampForBlock, 19614, 19615)).toBe(156912);
                expect(Slots.getSlotTime(getTimeStampForBlock, 19700, 19701)).toBe(157600);
                expect(Slots.getSlotTime(getTimeStampForBlock, 169000, 1)).toBe(1352000);
            });
        });

        describe("getNextSlot", () => {
            it("returns next slot", () => {
                expect(Slots.getNextSlot(getTimeStampForBlock)).toBeNumber();
            });
        });

        describe("isForgingAllowed", () => {
            it("returns boolean", () => {
                expect(Slots.isForgingAllowed(getTimeStampForBlock)).toBeDefined();
            });

            it("returns true when over half the time in the block remains", () => {
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 0)).toBeTrue();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 1)).toBeTrue();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 3)).toBeTrue();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 8)).toBeTrue();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 16)).toBeTrue();
            });

            it("returns false when under half the time in the block remains", () => {
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 4)).toBeFalse();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 5)).toBeFalse();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 6)).toBeFalse();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 7)).toBeFalse();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 15)).toBeFalse();
            });
        });

        describe("getTimeInMsUntilNextSlot", () => {
            it("should be ok", () => {
                const spyGetTime = jest.spyOn(Slots, "getTime");
                spyGetTime.mockReturnValue(200);
                const nextSlotTime = Slots.getSlotTime(getTimeStampForBlock, Slots.getNextSlot(getTimeStampForBlock));
                const now = Slots.getTime();
                expect(Slots.getTimeInMsUntilNextSlot(getTimeStampForBlock)).toEqual((nextSlotTime - now) * 1000);
            });
        });
    });

    describe("Dynamic block times", () => {
        describe("getSlotNumber", () => {
            it("should return the correct slot number given a timestamp within a known height", () => {
                const milestones = [
                    { height: 1, blocktime: 9 },
                    { height: 3, blocktime: 8 },
                    { height: 4, blocktime: 5 },
                ];
                const config = { ...devnet, milestones };
                configManager.setConfig(config);

                const getTimeStampForBlock = (height: number) => {
                    switch (height) {
                        case 1:
                            return 0;
                        case 2:
                            return 9;
                        case 3:
                            return 18;
                        default:
                            throw new Error(`Test scenarios should not hit this line`);
                    }
                };

                expect(Slots.getSlotNumber(getTimeStampForBlock, 1, 1)).toBe(0);
                expect(Slots.getSlotNumber(getTimeStampForBlock, 8, 1)).toBe(0);

                expect(Slots.getSlotNumber(getTimeStampForBlock, 9, 2)).toBe(1);
                expect(Slots.getSlotNumber(getTimeStampForBlock, 17, 2)).toBe(1);

                expect(Slots.getSlotNumber(getTimeStampForBlock, 18, 3)).toBe(2);
                expect(Slots.getSlotNumber(getTimeStampForBlock, 25, 3)).toBe(2);

                expect(Slots.getSlotNumber(getTimeStampForBlock, 26, 4)).toBe(3);
                expect(Slots.getSlotNumber(getTimeStampForBlock, 30, 4)).toBe(3);

                expect(Slots.getSlotNumber(getTimeStampForBlock, 31, 5)).toBe(4);
                expect(Slots.getSlotNumber(getTimeStampForBlock, 35, 5)).toBe(4);

                expect(Slots.getSlotNumber(getTimeStampForBlock, 36, 6)).toBe(5);
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

                const getTimeStampForBlock = (height: number) => {
                    switch (height) {
                        case 1:
                            return 0;
                        case 2:
                            return 8;
                        case 5:
                            return 34;
                        case 7:
                            return 53;
                        default:
                            throw new Error(`Test scenarios should not hit this line`);
                    }
                };

                expect(Slots.getSlotTime(getTimeStampForBlock, 1, 2)).toBe(8);
                expect(Slots.getSlotTime(getTimeStampForBlock, 2, 3)).toBe(16);
                expect(Slots.getSlotTime(getTimeStampForBlock, 3, 4)).toBe(25);
                expect(Slots.getSlotTime(getTimeStampForBlock, 4, 5)).toBe(34);
                expect(Slots.getSlotTime(getTimeStampForBlock, 5, 6)).toBe(43);
                expect(Slots.getSlotTime(getTimeStampForBlock, 6, 7)).toBe(53);
                expect(Slots.getSlotTime(getTimeStampForBlock, 7, 8)).toBe(63);
                expect(Slots.getSlotTime(getTimeStampForBlock, 8, 9)).toBe(71);
                expect(Slots.getSlotTime(getTimeStampForBlock, 14, 15)).toBe(119);
            });
        });

        describe("getSlotInfo", () => {
            it("should return correct values", () => {
                const milestones = [
                    { height: 1, blocktime: 4 },
                    { height: 4, blocktime: 3 },
                    { height: 6, blocktime: 5 },
                ];
                const config = { ...devnet, milestones };
                configManager.setConfig(config);

                const getTimeStampForBlock = (height: number) => {
                    switch (height) {
                        case 1:
                            return 0;
                        case 3:
                            return 8;
                        case 5:
                            return 15;
                        default:
                            throw new Error(`Test scenarios should not hit this line`);
                    }
                };

                expect(Slots.getSlotInfo(getTimeStampForBlock, 0, 1)).toEqual(
                    expect.objectContaining({
                        startTime: 0,
                        endTime: 3,
                        slotNumber: 0,
                        blockTime: 4,
                    }),
                );
                expect(Slots.getSlotInfo(getTimeStampForBlock, 3, 1)).toEqual(
                    expect.objectContaining({
                        startTime: 0,
                        endTime: 3,
                        slotNumber: 0,
                        blockTime: 4,
                    }),
                );

                expect(Slots.getSlotInfo(getTimeStampForBlock, 4, 2)).toEqual(
                    expect.objectContaining({
                        startTime: 4,
                        endTime: 7,
                        slotNumber: 1,
                        blockTime: 4,
                    }),
                );
                expect(Slots.getSlotInfo(getTimeStampForBlock, 7, 2)).toEqual(
                    expect.objectContaining({
                        startTime: 4,
                        endTime: 7,
                        slotNumber: 1,
                        blockTime: 4,
                    }),
                );

                expect(Slots.getSlotInfo(getTimeStampForBlock, 8, 3)).toEqual(
                    expect.objectContaining({
                        startTime: 8,
                        endTime: 11,
                        slotNumber: 2,
                        blockTime: 4,
                    }),
                );
                expect(Slots.getSlotInfo(getTimeStampForBlock, 11, 3)).toEqual(
                    expect.objectContaining({
                        startTime: 8,
                        endTime: 11,
                        slotNumber: 2,
                    }),
                );

                expect(Slots.getSlotInfo(getTimeStampForBlock, 12, 4)).toEqual(
                    expect.objectContaining({
                        startTime: 12,
                        endTime: 14,
                        slotNumber: 3,
                        blockTime: 3,
                    }),
                );
                expect(Slots.getSlotInfo(getTimeStampForBlock, 14, 4)).toEqual(
                    expect.objectContaining({
                        startTime: 12,
                        endTime: 14,
                        slotNumber: 3,
                        blockTime: 3,
                    }),
                );

                expect(Slots.getSlotInfo(getTimeStampForBlock, 15, 5)).toEqual(
                    expect.objectContaining({
                        startTime: 15,
                        endTime: 17,
                        slotNumber: 4,
                        blockTime: 3,
                    }),
                );
                expect(Slots.getSlotInfo(getTimeStampForBlock, 17, 5)).toEqual(
                    expect.objectContaining({
                        startTime: 15,
                        endTime: 17,
                        slotNumber: 4,
                        blockTime: 3,
                    }),
                );

                expect(Slots.getSlotInfo(getTimeStampForBlock, 18, 6)).toEqual(
                    expect.objectContaining({
                        startTime: 18,
                        endTime: 22,
                        slotNumber: 5,
                        blockTime: 5,
                    }),
                );
                expect(Slots.getSlotInfo(getTimeStampForBlock, 22, 6)).toEqual(
                    expect.objectContaining({
                        startTime: 18,
                        endTime: 22,
                        slotNumber: 5,
                        blockTime: 5,
                    }),
                );

                expect(Slots.getSlotInfo(getTimeStampForBlock, 23, 7)).toEqual(
                    expect.objectContaining({
                        startTime: 23,
                        endTime: 27,
                        slotNumber: 6,
                        blockTime: 5,
                    }),
                );
                expect(Slots.getSlotInfo(getTimeStampForBlock, 27, 7)).toEqual(
                    expect.objectContaining({
                        startTime: 23,
                        endTime: 27,
                        slotNumber: 6,
                        blockTime: 5,
                    }),
                );
            });
        });

        describe("isForgingAllowed", () => {
            const getTimeStampForBlock = (height: number) => {
                switch (height) {
                    case 1:
                        return 0;
                    case 2:
                        return 8;
                    case 3:
                        return 16;
                    default:
                        throw new Error(`Test scenarios should not hit this line`);
                }
            };

            it("returns true when over half the time in the block remains", () => {
                const milestones = [
                    { height: 1, blocktime: 8 },
                    { height: 3, blocktime: 7 },
                    { height: 4, blocktime: 5 },
                ];
                const config = { ...devnet, milestones };
                configManager.setConfig(config);

                expect(Slots.isForgingAllowed(getTimeStampForBlock, 0, 1)).toBeTrue();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 1, 1)).toBeTrue();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 3, 1)).toBeTrue();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 8, 2)).toBeTrue();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 11, 2)).toBeTrue();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 16, 3)).toBeTrue();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 18, 3)).toBeTrue();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 23, 4)).toBeTrue();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 28, 5)).toBeTrue();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 29, 5)).toBeTrue();
            });

            it("returns false when under half the time in the block remains", () => {
                const milestones = [
                    { height: 1, blocktime: 8 },
                    { height: 3, blocktime: 7 },
                    { height: 4, blocktime: 5 },
                ];
                const config = { ...devnet, milestones };
                configManager.setConfig(config);

                expect(Slots.isForgingAllowed(getTimeStampForBlock, 4, 1)).toBeFalse();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 5, 1)).toBeFalse();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 6, 1)).toBeFalse();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 7, 1)).toBeFalse();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 12, 2)).toBeFalse();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 15, 2)).toBeFalse();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 19, 3)).toBeFalse();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 22, 3)).toBeFalse();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 25, 4)).toBeFalse();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 26, 4)).toBeFalse();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 27, 4)).toBeFalse();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 30, 5)).toBeFalse();
                expect(Slots.isForgingAllowed(getTimeStampForBlock, 32, 5)).toBeFalse();
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

                expect(Slots.getSlotTime(getTimeStampForBlock, 0, 1)).toEqual(0);
                expect(Slots.getSlotTime(getTimeStampForBlock, 1, 2)).toEqual(4);
                expect(Slots.getSlotTime(getTimeStampForBlock, 2, 3)).toEqual(8);
                expect(Slots.getSlotTime(getTimeStampForBlock, 3, 3)).toEqual(12);
                expect(Slots.getSlotTime(getTimeStampForBlock, 4, 3)).toEqual(16);
                expect(Slots.getSlotTime(getTimeStampForBlock, 5, 4)).toEqual(20);
                expect(Slots.getSlotTime(getTimeStampForBlock, 6, 5)).toEqual(23);
                expect(Slots.getSlotTime(getTimeStampForBlock, 7, 6)).toEqual(26);
                expect(Slots.getSlotTime(getTimeStampForBlock, 8, 6)).toEqual(29);
                expect(Slots.getSlotTime(getTimeStampForBlock, 9, 7)).toEqual(32);
                expect(Slots.getSlotTime(getTimeStampForBlock, 10, 7)).toEqual(36);
                expect(Slots.getSlotTime(getTimeStampForBlock, 11, 8)).toEqual(40);
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

                expect(Slots.getSlotInfo(getTimeStampForBlock, 0, 1)).toEqual(
                    expect.objectContaining({
                        startTime: 0,
                        endTime: 3,
                        slotNumber: 0,
                        forgingStatus: true,
                    }),
                );
                expect(Slots.getSlotInfo(getTimeStampForBlock, 1, 1)).toEqual(
                    expect.objectContaining({
                        startTime: 0,
                        endTime: 3,
                        slotNumber: 0,
                        forgingStatus: true,
                    }),
                );
                expect(Slots.getSlotInfo(getTimeStampForBlock, 2, 1)).toEqual(
                    expect.objectContaining({
                        startTime: 0,
                        endTime: 3,
                        slotNumber: 0,
                        forgingStatus: false,
                    }),
                );
                expect(Slots.getSlotInfo(getTimeStampForBlock, 3, 1)).toEqual(
                    expect.objectContaining({
                        startTime: 0,
                        endTime: 3,
                        slotNumber: 0,
                        forgingStatus: false,
                    }),
                );

                expect(Slots.getSlotInfo(getTimeStampForBlock, 4, 2)).toEqual(
                    expect.objectContaining({
                        startTime: 4,
                        endTime: 7,
                        slotNumber: 1,
                    }),
                );
                expect(Slots.getSlotInfo(getTimeStampForBlock, 7, 2)).toEqual(
                    expect.objectContaining({
                        startTime: 4,
                        endTime: 7,
                        slotNumber: 1,
                    }),
                );

                expect(Slots.getSlotInfo(getTimeStampForBlock, 8, 3)).toEqual(
                    expect.objectContaining({
                        startTime: 8,
                        endTime: 11,
                        slotNumber: 2,
                    }),
                );
                expect(Slots.getSlotInfo(getTimeStampForBlock, 11, 3)).toEqual(
                    expect.objectContaining({
                        startTime: 8,
                        endTime: 11,
                        slotNumber: 2,
                    }),
                );

                expect(Slots.getSlotInfo(getTimeStampForBlock, 12, 3)).toEqual(
                    expect.objectContaining({
                        startTime: 12,
                        endTime: 15,
                        slotNumber: 3,
                    }),
                );
                expect(Slots.getSlotInfo(getTimeStampForBlock, 15, 3)).toEqual(
                    expect.objectContaining({
                        startTime: 12,
                        endTime: 15,
                        slotNumber: 3,
                    }),
                );

                expect(Slots.getSlotInfo(getTimeStampForBlock, 16, 3)).toEqual(
                    expect.objectContaining({
                        startTime: 16,
                        endTime: 19,
                        slotNumber: 4,
                    }),
                );
                expect(Slots.getSlotInfo(getTimeStampForBlock, 19, 3)).toEqual(
                    expect.objectContaining({
                        startTime: 16,
                        endTime: 19,
                        slotNumber: 4,
                    }),
                );

                expect(Slots.getSlotInfo(getTimeStampForBlock, 20, 4)).toEqual(
                    expect.objectContaining({
                        startTime: 20,
                        endTime: 22,
                        slotNumber: 5,
                    }),
                );
                expect(Slots.getSlotInfo(getTimeStampForBlock, 22, 4)).toEqual(
                    expect.objectContaining({
                        startTime: 20,
                        endTime: 22,
                        slotNumber: 5,
                    }),
                );

                expect(Slots.getSlotInfo(getTimeStampForBlock, 23, 5)).toEqual(
                    expect.objectContaining({
                        startTime: 23,
                        endTime: 25,
                        slotNumber: 6,
                    }),
                );
                expect(Slots.getSlotInfo(getTimeStampForBlock, 25, 5)).toEqual(
                    expect.objectContaining({
                        startTime: 23,
                        endTime: 25,
                        slotNumber: 6,
                    }),
                );

                expect(Slots.getSlotInfo(getTimeStampForBlock, 26, 6)).toEqual(
                    expect.objectContaining({
                        startTime: 26,
                        endTime: 28,
                        slotNumber: 7,
                    }),
                );
                expect(Slots.getSlotInfo(getTimeStampForBlock, 28, 6)).toEqual(
                    expect.objectContaining({
                        startTime: 26,
                        endTime: 28,
                        slotNumber: 7,
                    }),
                );

                expect(Slots.getSlotInfo(getTimeStampForBlock, 29, 6)).toEqual(
                    expect.objectContaining({
                        startTime: 29,
                        endTime: 31,
                        slotNumber: 8,
                    }),
                );
                expect(Slots.getSlotInfo(getTimeStampForBlock, 31, 6)).toEqual(
                    expect.objectContaining({
                        startTime: 29,
                        endTime: 31,
                        slotNumber: 8,
                    }),
                );

                expect(Slots.getSlotInfo(getTimeStampForBlock, 32, 7)).toEqual(
                    expect.objectContaining({
                        startTime: 32,
                        endTime: 35,
                        slotNumber: 9,
                    }),
                );
                expect(Slots.getSlotInfo(getTimeStampForBlock, 35, 7)).toEqual(
                    expect.objectContaining({
                        startTime: 32,
                        endTime: 35,
                        slotNumber: 9,
                    }),
                );

                expect(Slots.getSlotInfo(getTimeStampForBlock, 36, 7)).toEqual(
                    expect.objectContaining({
                        startTime: 36,
                        endTime: 39,
                        slotNumber: 10,
                    }),
                );
                expect(Slots.getSlotInfo(getTimeStampForBlock, 39, 7)).toEqual(
                    expect.objectContaining({
                        startTime: 36,
                        endTime: 39,
                        slotNumber: 10,
                    }),
                );

                expect(Slots.getSlotInfo(getTimeStampForBlock, 40, 8)).toEqual(
                    expect.objectContaining({
                        startTime: 40,
                        endTime: 43,
                        slotNumber: 11,
                        forgingStatus: true,
                    }),
                );
                expect(Slots.getSlotInfo(getTimeStampForBlock, 41, 8)).toEqual(
                    expect.objectContaining({
                        startTime: 40,
                        endTime: 43,
                        slotNumber: 11,
                        forgingStatus: true,
                    }),
                );
                expect(Slots.getSlotInfo(getTimeStampForBlock, 42, 8)).toEqual(
                    expect.objectContaining({
                        startTime: 40,
                        endTime: 43,
                        slotNumber: 11,
                        forgingStatus: false,
                    }),
                );
                expect(Slots.getSlotInfo(getTimeStampForBlock, 43, 8)).toEqual(
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
