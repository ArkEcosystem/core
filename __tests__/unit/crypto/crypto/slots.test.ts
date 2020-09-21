import "jest-extended";

import { Slots } from "@packages/crypto/src/crypto/slots";
import { configManager } from "@packages/crypto/src/managers/config";
import { devnet } from "@packages/crypto/src/networks";

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

    // @ts-ignore
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

        describe("getSlotInfo", () => {
            it("should return positive values when called without timestamp", () => {
                const slotInfo = Slots.getSlotInfo(getTimeStampForBlock, undefined, undefined);

                expect(slotInfo.startTime).toBePositive();
                expect(slotInfo.endTime).toBePositive();
                expect(slotInfo.blockTime).toBePositive();
                expect(slotInfo.slotNumber).toBePositive();
                expect(slotInfo.forgingStatus).toBeBoolean();
            });

            it("should return correct values", () => {
                /* eslint-disable */
                const expectedResults = [
                    { height: 1, timestamp: 0, startTime: 0, endTime: 7, blockTime: 8, slotNumber: 0,  forgingStatus: true },
                    { height: 2, timestamp: 8, startTime: 8, endTime: 15, blockTime: 8, slotNumber: 1,  forgingStatus: true },
                    { height: 3, timestamp: 16, startTime: 16, endTime: 23, blockTime: 8, slotNumber: 2,  forgingStatus: true },
                    { height: 4, timestamp: 24, startTime: 24, endTime: 31, blockTime: 8, slotNumber: 3,  forgingStatus: true },

                    { height: 4, timestamp: 25, startTime: 24, endTime: 31, blockTime: 8, slotNumber: 3,  forgingStatus: true },
                    { height: 4, timestamp: 26, startTime: 24, endTime: 31, blockTime: 8, slotNumber: 3,  forgingStatus: true },
                    { height: 4, timestamp: 27, startTime: 24, endTime: 31, blockTime: 8, slotNumber: 3,  forgingStatus: true },
                ]

                const endSlotTimeResults = [
                    { height: 1, timestamp: 7, startTime: 0, endTime: 7, blockTime: 8, slotNumber: 0,  forgingStatus: false },
                    { height: 2, timestamp: 15, startTime: 8, endTime: 15, blockTime: 8, slotNumber: 1,  forgingStatus: false },
                    { height: 3, timestamp: 23, startTime: 16, endTime: 23, blockTime: 8, slotNumber: 2,  forgingStatus: false },
                    { height: 4, timestamp: 31, startTime: 24, endTime: 31, blockTime: 8, slotNumber: 3,  forgingStatus: false },

                    { height: 4, timestamp: 30, startTime: 24, endTime: 31, blockTime: 8, slotNumber: 3,  forgingStatus: false },
                    { height: 4, timestamp: 29, startTime: 24, endTime: 31, blockTime: 8, slotNumber: 3,  forgingStatus: false },
                    { height: 4, timestamp: 28, startTime: 24, endTime: 31, blockTime: 8, slotNumber: 3,  forgingStatus: false },
                ]

                const missedBlocks = [
                    { height: 2, timestamp: 24, startTime: 24, endTime: 31, blockTime: 8, slotNumber: 3,  forgingStatus: true },
                    { height: 2, timestamp: 31, startTime: 24, endTime: 31, blockTime: 8, slotNumber: 3,  forgingStatus: false },
                ]

                expectedResults.concat(endSlotTimeResults).concat(missedBlocks).forEach((item) => {
                    expect(Slots.getSlotInfo(getTimeStampForBlock, item.timestamp, item.height)).toEqual({
                        startTime: item.startTime,
                        endTime: item.endTime,
                        blockTime: item.blockTime,
                        slotNumber: item.slotNumber,
                        forgingStatus: item.forgingStatus,
                    });
                });
            });
        })

        describe("getNextSlot", () => {
            it("returns next slot", () => {
                expect(Slots.getNextSlot(getTimeStampForBlock)).toBeNumber();
            });

            it("returns next when height is defined in configManager", () => {
                configManager.setHeight(12);
                expect(Slots.getNextSlot(getTimeStampForBlock)).toBeNumber();
            });
        });

        describe("isForgingAllowed", () => {
            it("returns boolean", () => {
                expect(Slots.isForgingAllowed(getTimeStampForBlock)).toBeBoolean();
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
                // @ts-ignore
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
                // @ts-ignore
                configManager.setConfig(config);

                const getTimeStampForBlock = (height: number) => {
                    switch (height) {
                        case 1:
                            return 0;
                        case 2:
                            return 8;
                        case 3:
                            return 16;
                        case 5:
                            return 34;
                        case 6:
                            return 43;
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
                    { height: 1, blocktime: 8 },
                    { height: 2, blocktime: 4 },
                    { height: 4, blocktime: 3 },
                    { height: 6, blocktime: 4 },
                ];
                const config = { ...devnet, milestones };
                // @ts-ignore
                configManager.setConfig(config);

                const getTimeStampForBlock = (height: number) => {
                    switch (height) {
                        case 1:
                            return 0;
                        case 2:
                            return 8;
                        case 3:
                            return 12;
                        case 4:
                            return 16;
                        case 5:
                            return 19;
                        default:
                            throw new Error(`Test scenarios should not hit this line`);
                    }
                };

                /* eslint-disable */
                const expectedResults = [
                    { height: 1, timestamp: 0, startTime: 0, endTime: 7, blockTime: 8, slotNumber: 0,  forgingStatus: true },
                    { height: 2, timestamp: 8, startTime: 8, endTime: 11, blockTime: 4, slotNumber: 1,  forgingStatus: true },
                    { height: 3, timestamp: 12, startTime: 12, endTime: 15, blockTime: 4, slotNumber: 2,  forgingStatus: true },
                    { height: 4, timestamp: 16, startTime: 16, endTime: 18, blockTime: 3, slotNumber: 3,  forgingStatus: true },
                    { height: 5, timestamp: 19, startTime: 19, endTime: 21, blockTime: 3, slotNumber: 4,  forgingStatus: true },
                    { height: 6, timestamp: 22, startTime: 22, endTime: 25, blockTime: 4, slotNumber: 5,  forgingStatus: true },
                    { height: 7, timestamp: 26, startTime: 26, endTime: 29, blockTime: 4, slotNumber: 6,  forgingStatus: true },
                ]

                const endSlotTimeResults = [
                    { height: 1, timestamp: 7, startTime: 0, endTime: 7, blockTime: 8, slotNumber: 0,  forgingStatus: false },
                    { height: 2, timestamp: 11, startTime: 8, endTime: 11, blockTime: 4, slotNumber: 1,  forgingStatus: false },
                    { height: 3, timestamp: 15, startTime: 12, endTime: 15, blockTime: 4, slotNumber: 2,  forgingStatus: false },
                    { height: 4, timestamp: 18, startTime: 16, endTime: 18, blockTime: 3, slotNumber: 3,  forgingStatus: false },
                    { height: 5, timestamp: 21, startTime: 19, endTime: 21, blockTime: 3, slotNumber: 4,  forgingStatus: false },
                    { height: 6, timestamp: 25, startTime: 22, endTime: 25, blockTime: 4, slotNumber: 5,  forgingStatus: false },
                    { height: 7, timestamp: 29, startTime: 26, endTime: 29, blockTime: 4, slotNumber: 6,  forgingStatus: false },
                ]

                const missedBlocks = [
                    { height: 3, timestamp: 16, startTime: 16, endTime: 19, blockTime: 4, slotNumber: 3,  forgingStatus: true },
                    { height: 3, timestamp: 20, startTime: 20, endTime: 23, blockTime: 4, slotNumber: 4,  forgingStatus: true },
                    { height: 3, timestamp: 24, startTime: 24, endTime: 27, blockTime: 4, slotNumber: 5,  forgingStatus: true },
                    { height: 3, timestamp: 27, startTime: 24, endTime: 27, blockTime: 4, slotNumber: 5,  forgingStatus: false },
                    { height: 4, timestamp: 19, startTime: 19, endTime: 21, blockTime: 3, slotNumber: 4,  forgingStatus: true },
                    { height: 4, timestamp: 22, startTime: 22, endTime: 24, blockTime: 3, slotNumber: 5,  forgingStatus: true },
                    { height: 4, timestamp: 24, startTime: 22, endTime: 24, blockTime: 3, slotNumber: 5,  forgingStatus: false },
                    { height: 7, timestamp: 30, startTime: 30, endTime: 33, blockTime: 4, slotNumber: 7,  forgingStatus: true },
                    { height: 7, timestamp: 34, startTime: 34, endTime: 37, blockTime: 4, slotNumber: 8,  forgingStatus: true },
                    { height: 7, timestamp: 37, startTime: 34, endTime: 37, blockTime: 4, slotNumber: 8,  forgingStatus: false },
                ]

                expectedResults.concat(endSlotTimeResults).concat(missedBlocks).forEach((item) => {
                    expect(Slots.getSlotInfo(getTimeStampForBlock, item.timestamp, item.height)).toEqual({
                        startTime: item.startTime,
                        endTime: item.endTime,
                        blockTime: item.blockTime,
                        slotNumber: item.slotNumber,
                        forgingStatus: item.forgingStatus,
                    });
                });
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
                // @ts-ignore
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
                // @ts-ignore
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
                // @ts-ignore
                configManager.setConfig(config);


                const getTimeStampForBlock = (height: number) => {
                    switch (height) {
                        case 1:
                            return 0;
                        case 3:
                            return 8;
                        case 4:
                            return 12;
                        case 6:
                            return 18;
                        default:
                            throw new Error(`Test scenarios should not hit this line`);
                    }
                };

                const expectedResults = [
                    { height: 1, slot: 0, slotTime: 0 },
                    { height: 2, slot: 1, slotTime: 4 },
                    { height: 3, slot: 2, slotTime: 8 },
                    { height: 4, slot: 3, slotTime: 12 },
                    { height: 5, slot: 4, slotTime: 15 },
                    { height: 6, slot: 5, slotTime: 18 },
                    { height: 7, slot: 6, slotTime: 21 },
                    { height: 8, slot: 7, slotTime: 25 },
                    { height: 9, slot: 8, slotTime: 29 },
                    { height: 10, slot: 9, slotTime: 33 },
                    { height: 11, slot: 10, slotTime: 37 },
                ]

                const missedBlocks = [
                    { height: 2, slot: 2, slotTime: 8 },
                    { height: 2, slot: 3, slotTime: 12 },
                    { height: 2, slot: 9, slotTime: 36 },
                    { height: 4, slot: 4, slotTime: 15 },
                    { height: 4, slot: 14, slotTime: 45 },
                    { height: 7, slot: 7, slotTime: 25 },
                    { height: 7, slot: 8, slotTime: 29 },
                    { height: 11, slot: 11, slotTime: 41 },
                    { height: 11, slot: 21, slotTime: 81 },
                ]

                expectedResults.concat(missedBlocks).forEach((item) => {
                    expect(Slots.getSlotTime(getTimeStampForBlock, item.slot, item.height)).toEqual(item.slotTime);
                });
            });
        });

        describe("getSlotInfo", () => {
            let getTimeStampForBlock

            beforeEach(() => {
                const milestones = [
                    { height: 1, blocktime: 4, epoch: "2017-03-21T13:00:00.000Z" },
                    { height: 4, blocktime: 3 },
                    { height: 7, blocktime: 4 },
                ];
                const config = { ...devnet, milestones };
                // @ts-ignore
                configManager.setConfig(config);

                getTimeStampForBlock = (height: number) => {
                    switch (height) {
                        case 1:
                            return 0;
                        case 3:
                            return 16;
                        case 4:
                            return 20;
                        case 6:
                            return 29;
                        default:
                            throw new Error(`Test scenarios should not hit this line`);
                    }
                };
            })

            it("should return positive values when called without timestamp", () => {
                const slotInfo = Slots.getSlotInfo(getTimeStampForBlock, undefined, undefined);

                expect(slotInfo.startTime).toBePositive();
                expect(slotInfo.endTime).toBePositive();
                expect(slotInfo.blockTime).toBeGreaterThanOrEqual(3);
                expect(slotInfo.blockTime).toBeLessThanOrEqual(4);
                expect(slotInfo.slotNumber).toBePositive();
                expect(slotInfo.forgingStatus).toBeBoolean();
            });

            it("should calculate the next slot correctly when slots have been missed", () => {
                /* eslint-disable */
                const expectedResults = [
                    { height: 1, timestamp: 0, startTime: 0, endTime: 3, blockTime: 4, slotNumber: 0,  forgingStatus: true },
                    { height: 1, timestamp: 1, startTime: 0, endTime: 3, blockTime: 4, slotNumber: 0,  forgingStatus: true },
                    { height: 2, timestamp: 4, startTime: 4, endTime: 7, blockTime: 4, slotNumber: 1,  forgingStatus: true },
                    { height: 3, timestamp: 8, startTime: 8, endTime: 11, blockTime: 4, slotNumber: 2,  forgingStatus: true },
                    { height: 4, timestamp: 20, startTime: 20, endTime: 22, blockTime: 3, slotNumber: 5,  forgingStatus: true },
                    { height: 5, timestamp: 23, startTime: 23, endTime: 25, blockTime: 3, slotNumber: 6,  forgingStatus: true },
                    { height: 6, timestamp: 29, startTime: 29, endTime: 31, blockTime: 3, slotNumber: 8,  forgingStatus: true },
                    { height: 7, timestamp: 32, startTime: 32, endTime: 35, blockTime: 4, slotNumber: 9,  forgingStatus: true },
                    { height: 8, timestamp: 40, startTime: 40, endTime: 43, blockTime: 4, slotNumber: 11,  forgingStatus: true },
                    { height: 8, timestamp: 41, startTime: 40, endTime: 43, blockTime: 4, slotNumber: 11,  forgingStatus: true },
                ];

                const offTimeResults = [
                    { height: 1, timestamp: 2, startTime: 0, endTime: 3, blockTime: 4, slotNumber: 0,  forgingStatus: false },
                    { height: 1, timestamp: 3, startTime: 0, endTime: 3, blockTime: 4, slotNumber: 0,  forgingStatus: false },
                    { height: 2, timestamp: 7, startTime: 4, endTime: 7, blockTime: 4, slotNumber: 1,  forgingStatus: false },
                    { height: 3, timestamp: 11, startTime: 8, endTime: 11, blockTime: 4, slotNumber: 2,  forgingStatus: false },
                    { height: 4, timestamp: 22, startTime: 20, endTime: 22, blockTime: 3, slotNumber: 5,  forgingStatus: false },
                    { height: 5, timestamp: 25, startTime: 23, endTime: 25, blockTime: 3, slotNumber: 6,  forgingStatus: false },
                    { height: 6, timestamp: 31, startTime: 29, endTime: 31, blockTime: 3, slotNumber: 8,  forgingStatus: false },
                    { height: 7, timestamp: 35, startTime: 32, endTime: 35, blockTime: 4, slotNumber: 9,  forgingStatus: false },
                    { height: 8, timestamp: 42, startTime: 40, endTime: 43, blockTime: 4, slotNumber: 11,  forgingStatus: false },
                    { height: 8, timestamp: 43, startTime: 40, endTime: 43, blockTime: 4, slotNumber: 11,  forgingStatus: false },
                ]

                const missedSlots = [
                    { height: 3, timestamp: 12, startTime: 12, endTime: 15, blockTime: 4, slotNumber: 3,  forgingStatus: true },
                    { height: 3, timestamp: 16, startTime: 16, endTime: 19, blockTime: 4, slotNumber: 4,  forgingStatus: true },
                    { height: 5, timestamp: 26, startTime: 26, endTime: 28, blockTime: 3, slotNumber: 7,  forgingStatus: true },
                    { height: 7, timestamp: 36, startTime: 36, endTime: 39, blockTime: 4, slotNumber: 10,  forgingStatus: true },

                ]

                const missedOffTimeResults = [
                    { height: 3, timestamp: 15, startTime: 12, endTime: 15, blockTime: 4, slotNumber: 3,  forgingStatus: false },
                    { height: 3, timestamp: 19, startTime: 16, endTime: 19, blockTime: 4, slotNumber: 4,  forgingStatus: false },
                    { height: 5, timestamp: 28, startTime: 26, endTime: 28, blockTime: 3, slotNumber: 7,  forgingStatus: false },
                    { height: 7, timestamp: 39, startTime: 36, endTime: 39, blockTime: 4, slotNumber: 10,  forgingStatus: false },

                ]

                expectedResults.concat(offTimeResults).concat(missedSlots).concat(missedOffTimeResults).forEach((item) => {
                    expect(Slots.getSlotInfo(getTimeStampForBlock, item.timestamp, item.height)).toEqual({
                        startTime: item.startTime,
                        endTime: item.endTime,
                        blockTime: item.blockTime,
                        slotNumber: item.slotNumber,
                        forgingStatus: item.forgingStatus,
                    });
                });
            });
        });
    });
});
