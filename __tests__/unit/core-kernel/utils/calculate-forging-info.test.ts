import "jest-extended";

import {
    calculateForgingInfo,
    getMilestonesWhichAffectActiveDelegateCount,
} from "@packages/core-kernel/src/utils/calculate-forging-info";
import { Managers } from "@packages/crypto";
import { configManager } from "@packages/crypto/src/managers";
import { devnet } from "@packages/crypto/src/networks";

afterEach(() => jest.clearAllMocks());

const mockGetBlockTimeLookup = (height: number) => {
    switch (height) {
        case 1:
            return 0;
        default:
            throw new Error(`Test scenarios should not hit this line`);
    }
};

describe("getMilestonesWhichAffectActiveDelegateCount", () => {
    it("should return milestones which changes delegate count", () => {
        expect(getMilestonesWhichAffectActiveDelegateCount().length).toEqual(1);

        const milestones = [
            { height: 1, activeDelegates: 4 },
            { height: 5, activeDelegates: 4 },
            { height: 9, activeDelegates: 8 },
            { height: 15, activeDelegates: 8 },
        ];

        const config = { ...devnet, milestones };
        configManager.setConfig(config);
        Managers.configManager.setConfig(config);

        expect(getMilestonesWhichAffectActiveDelegateCount().length).toEqual(2);
    });
});

describe("calculateForgingInfo", () => {
    it("should calculate forgingInfo correctly for fixed block times", async () => {
        const milestones = [{ height: 1, blocktime: 8, activeDelegates: 4 }];

        const config = { ...devnet, milestones };
        configManager.setConfig(config);
        Managers.configManager.setConfig(config);

        const expectedResults = [
            { height: 1, timestamp: 0, currentForger: 0, nextForger: 1, blockTimestamp: 0, canForge: true },
            { height: 2, timestamp: 8, currentForger: 1, nextForger: 2, blockTimestamp: 8, canForge: true },
            { height: 3, timestamp: 16, currentForger: 2, nextForger: 3, blockTimestamp: 16, canForge: true },
            { height: 4, timestamp: 24, currentForger: 3, nextForger: 0, blockTimestamp: 24, canForge: true },
            { height: 5, timestamp: 32, currentForger: 0, nextForger: 1, blockTimestamp: 32, canForge: true },
            { height: 6, timestamp: 40, currentForger: 1, nextForger: 2, blockTimestamp: 40, canForge: true },
            { height: 7, timestamp: 48, currentForger: 2, nextForger: 3, blockTimestamp: 48, canForge: true },
            { height: 8, timestamp: 56, currentForger: 3, nextForger: 0, blockTimestamp: 56, canForge: true },
            { height: 9, timestamp: 64, currentForger: 0, nextForger: 1, blockTimestamp: 64, canForge: true },
        ];

        const offTimeResults = [
            { height: 1, timestamp: 7, currentForger: 0, nextForger: 1, blockTimestamp: 0, canForge: false },
            { height: 2, timestamp: 15, currentForger: 1, nextForger: 2, blockTimestamp: 8, canForge: false },
        ];

        expectedResults.concat(offTimeResults).forEach((item) => {
            expect(calculateForgingInfo(item.timestamp, item.height, mockGetBlockTimeLookup)).toEqual({
                currentForger: item.currentForger,
                nextForger: item.nextForger,
                blockTimestamp: item.blockTimestamp,
                canForge: item.canForge,
            });
        });
    });

    it("should calculate the currentForger index correctly for dynamic block times", async () => {
        const milestones = [
            { height: 1, blocktime: 8, activeDelegates: 4 },
            { height: 2, blocktime: 4 },
            { height: 4, blocktime: 3 },
            { height: 6, blocktime: 4 },
        ];

        const mockGetBlockTimeLookup = (height: number) => {
            switch (height) {
                case 0:
                    return 0;
                case 1:
                    return 8;
                case 3:
                    return 12;
                case 5:
                    return 19;
                default:
                    throw new Error(`Test scenarios should not hit this line`);
            }
        };

        const config = { ...devnet, milestones };
        configManager.setConfig(config);
        Managers.configManager.setConfig(config);

        const expectedResults = [
            { height: 1, timestamp: 0, currentForger: 0, nextForger: 1, blockTimestamp: 0, canForge: true }, // + 8
            { height: 2, timestamp: 8, currentForger: 1, nextForger: 2, blockTimestamp: 8, canForge: true }, // + 4
            { height: 3, timestamp: 12, currentForger: 2, nextForger: 3, blockTimestamp: 12, canForge: true },
            { height: 4, timestamp: 16, currentForger: 3, nextForger: 0, blockTimestamp: 16, canForge: true }, // + 3
            { height: 5, timestamp: 19, currentForger: 0, nextForger: 1, blockTimestamp: 19, canForge: true },
            { height: 6, timestamp: 21, currentForger: 1, nextForger: 2, blockTimestamp: 21, canForge: true }, // + 4
            { height: 7, timestamp: 25, currentForger: 2, nextForger: 3, blockTimestamp: 25, canForge: true },
            { height: 8, timestamp: 29, currentForger: 3, nextForger: 0, blockTimestamp: 29, canForge: true },
        ];

        const offTimeResults = [
            // { height: 1, timestamp: 7, currentForger: 0, nextForger: 1, blockTimestamp: 0, canForge: false },
        ];

        expectedResults.concat(offTimeResults).forEach((item) => {
            expect(calculateForgingInfo(item.timestamp, item.height, mockGetBlockTimeLookup)).toEqual({
                currentForger: item.currentForger,
                nextForger: item.nextForger,
                blockTimestamp: item.blockTimestamp,
                canForge: item.canForge,
            });
        });

        expect(calculateForgingInfo(16, 4, mockGetBlockTimeLookup).currentForger).toEqual(3);
        expect(calculateForgingInfo(19, 5, mockGetBlockTimeLookup).currentForger).toEqual(0);
        expect(calculateForgingInfo(22, 6, mockGetBlockTimeLookup).currentForger).toEqual(1);
        expect(calculateForgingInfo(26, 7, mockGetBlockTimeLookup).currentForger).toEqual(2);
        expect(calculateForgingInfo(30, 8, mockGetBlockTimeLookup).currentForger).toEqual(3);
        expect(calculateForgingInfo(34, 9, mockGetBlockTimeLookup).currentForger).toEqual(0);
        expect(calculateForgingInfo(38, 10, mockGetBlockTimeLookup).currentForger).toEqual(1);
        expect(calculateForgingInfo(46, 12, mockGetBlockTimeLookup).currentForger).toEqual(3);
        expect(calculateForgingInfo(54, 14, mockGetBlockTimeLookup).currentForger).toEqual(1);
    });

    it("should calculate the blockTimestamp index correctly for dynamic block times", async () => {
        const milestones = [
            { height: 1, blocktime: 8, activeDelegates: 4 },
            { height: 2, blocktime: 4 },
            { height: 4, blocktime: 3 },
            { height: 6, blocktime: 4 },
        ];

        const config = { ...devnet, milestones };

        configManager.setConfig(config);
        Managers.configManager.setConfig(config);

        const mockGetBlockTimeLookup = (height: number) => {
            switch (height) {
                case 0:
                    return 0;
                case 1:
                    return 8;
                case 3:
                    return 12;
                case 5:
                    return 19;
                default:
                    throw new Error(`Test scenarios should not hit this line`);
            }
        };

        expect(calculateForgingInfo(0, 1, mockGetBlockTimeLookup).blockTimestamp).toEqual(0);
        expect(calculateForgingInfo(7, 1, mockGetBlockTimeLookup).blockTimestamp).toEqual(0);

        expect(calculateForgingInfo(8, 2, mockGetBlockTimeLookup).blockTimestamp).toEqual(8);
        expect(calculateForgingInfo(11, 2, mockGetBlockTimeLookup).blockTimestamp).toEqual(8);

        expect(calculateForgingInfo(12, 3, mockGetBlockTimeLookup).blockTimestamp).toEqual(12);
        expect(calculateForgingInfo(15, 3, mockGetBlockTimeLookup).blockTimestamp).toEqual(12);
        expect(calculateForgingInfo(16, 4, mockGetBlockTimeLookup).blockTimestamp).toEqual(16);
        expect(calculateForgingInfo(17, 4, mockGetBlockTimeLookup).blockTimestamp).toEqual(16);

        expect(calculateForgingInfo(19, 5, mockGetBlockTimeLookup).blockTimestamp).toEqual(19);
        expect(calculateForgingInfo(21, 5, mockGetBlockTimeLookup).blockTimestamp).toEqual(19);
        expect(calculateForgingInfo(22, 6, mockGetBlockTimeLookup).blockTimestamp).toEqual(22);
        expect(calculateForgingInfo(25, 6, mockGetBlockTimeLookup).blockTimestamp).toEqual(22);

        expect(calculateForgingInfo(26, 7, mockGetBlockTimeLookup).blockTimestamp).toEqual(26);
        expect(calculateForgingInfo(29, 7, mockGetBlockTimeLookup).blockTimestamp).toEqual(26);

        expect(calculateForgingInfo(30, 8, mockGetBlockTimeLookup).blockTimestamp).toEqual(30);
        expect(calculateForgingInfo(33, 8, mockGetBlockTimeLookup).blockTimestamp).toEqual(30);

        expect(calculateForgingInfo(34, 9, mockGetBlockTimeLookup).blockTimestamp).toEqual(34);
        expect(calculateForgingInfo(38, 10, mockGetBlockTimeLookup).blockTimestamp).toEqual(38);
        expect(calculateForgingInfo(46, 12, mockGetBlockTimeLookup).blockTimestamp).toEqual(46);

        expect(calculateForgingInfo(53, 12, mockGetBlockTimeLookup).blockTimestamp).toEqual(50);
        expect(calculateForgingInfo(54, 14, mockGetBlockTimeLookup).blockTimestamp).toEqual(54);
    });

    it("should calculate the nextForger index correctly for dynamic block times", async () => {
        const milestones = [
            { height: 1, blocktime: 8, activeDelegates: 4 },
            { height: 2, blocktime: 4 },
            { height: 4, blocktime: 3 },
            { height: 6, blocktime: 4 },
        ];

        const mockGetBlockTimeLookup = (height: number) => {
            switch (height) {
                case 0:
                    return 0;
                case 1:
                    return 8;
                case 3:
                    return 12;
                case 5:
                    return 19;
                default:
                    throw new Error(`Test scenarios should not hit this line`);
            }
        };

        const config = { ...devnet, milestones };
        configManager.setConfig(config);
        Managers.configManager.setConfig(config);

        expect(calculateForgingInfo(0, 1, mockGetBlockTimeLookup).nextForger).toEqual(1);
        expect(calculateForgingInfo(7, 1, mockGetBlockTimeLookup).nextForger).toEqual(1);
        expect(calculateForgingInfo(16, 4, mockGetBlockTimeLookup).nextForger).toEqual(0);
        expect(calculateForgingInfo(19, 5, mockGetBlockTimeLookup).nextForger).toEqual(1);
        expect(calculateForgingInfo(22, 6, mockGetBlockTimeLookup).nextForger).toEqual(2);
        expect(calculateForgingInfo(26, 7, mockGetBlockTimeLookup).nextForger).toEqual(3);
        expect(calculateForgingInfo(30, 8, mockGetBlockTimeLookup).nextForger).toEqual(0);
        expect(calculateForgingInfo(34, 9, mockGetBlockTimeLookup).nextForger).toEqual(1);
        expect(calculateForgingInfo(38, 10, mockGetBlockTimeLookup).nextForger).toEqual(2);
        expect(calculateForgingInfo(46, 12, mockGetBlockTimeLookup).nextForger).toEqual(0);
        expect(calculateForgingInfo(54, 14, mockGetBlockTimeLookup).nextForger).toEqual(2);
    });

    it("should calculate the currentForger index correctly for dynamic block times and changing max delegate numbers", async () => {
        const milestones = [
            { height: 1, blocktime: 4, activeDelegates: 4 },
            { height: 4, blocktime: 3 },
            { height: 6, blocktime: 5, activeDelegates: 5 },
        ];

        const config = { ...devnet, milestones };
        // @ts-ignore
        jest.spyOn(configManager, "validateMilestones").mockReturnValue(true);
        // @ts-ignore
        jest.spyOn(Managers.configManager, "validateMilestones").mockReturnValue(true);
        configManager.setConfig(config);
        Managers.configManager.setConfig(config);

        const mockGetBlockTimeLookup = (height: number) => {
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

        expect(calculateForgingInfo(0, 1, mockGetBlockTimeLookup).currentForger).toEqual(0);
        expect(calculateForgingInfo(4, 2, mockGetBlockTimeLookup).currentForger).toEqual(1);
        expect(calculateForgingInfo(8, 3, mockGetBlockTimeLookup).currentForger).toEqual(2);
        expect(calculateForgingInfo(12, 4, mockGetBlockTimeLookup).currentForger).toEqual(3);
        expect(calculateForgingInfo(15, 5, mockGetBlockTimeLookup).currentForger).toEqual(0);
        expect(calculateForgingInfo(18, 6, mockGetBlockTimeLookup).currentForger).toEqual(1);
        expect(calculateForgingInfo(23, 7, mockGetBlockTimeLookup).currentForger).toEqual(2);
        expect(calculateForgingInfo(28, 8, mockGetBlockTimeLookup).currentForger).toEqual(3);
        expect(calculateForgingInfo(33, 9, mockGetBlockTimeLookup).currentForger).toEqual(0);
        expect(calculateForgingInfo(38, 10, mockGetBlockTimeLookup).currentForger).toEqual(1);
        expect(calculateForgingInfo(53, 13, mockGetBlockTimeLookup).currentForger).toEqual(4);
        expect(calculateForgingInfo(58, 14, mockGetBlockTimeLookup).currentForger).toEqual(0);
    });

    it("should calculate the nextForger index correctly for dynamic block times and changing max delegate numbers", async () => {
        const milestones = [
            { height: 1, blocktime: 4, activeDelegates: 4 },
            { height: 4, blocktime: 3 },
            { height: 6, blocktime: 5, activeDelegates: 5 },
        ];

        const config = { ...devnet, milestones };
        // @ts-ignore
        jest.spyOn(configManager, "validateMilestones").mockReturnValue(true);
        // @ts-ignore
        jest.spyOn(Managers.configManager, "validateMilestones").mockReturnValue(true);
        configManager.setConfig(config);
        Managers.configManager.setConfig(config);

        const mockGetBlockTimeLookup = (height: number) => {
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

        expect(calculateForgingInfo(0, 1, mockGetBlockTimeLookup).nextForger).toEqual(1);
        expect(calculateForgingInfo(4, 2, mockGetBlockTimeLookup).nextForger).toEqual(2);
        expect(calculateForgingInfo(8, 3, mockGetBlockTimeLookup).nextForger).toEqual(3);
        expect(calculateForgingInfo(12, 4, mockGetBlockTimeLookup).nextForger).toEqual(0);
        expect(calculateForgingInfo(15, 5, mockGetBlockTimeLookup).nextForger).toEqual(1);
        expect(calculateForgingInfo(18, 6, mockGetBlockTimeLookup).nextForger).toEqual(2);
        expect(calculateForgingInfo(23, 7, mockGetBlockTimeLookup).nextForger).toEqual(3);
        expect(calculateForgingInfo(28, 8, mockGetBlockTimeLookup).nextForger).toEqual(0);
        expect(calculateForgingInfo(33, 9, mockGetBlockTimeLookup).nextForger).toEqual(1);
        expect(calculateForgingInfo(38, 10, mockGetBlockTimeLookup).nextForger).toEqual(2);
        expect(calculateForgingInfo(53, 13, mockGetBlockTimeLookup).nextForger).toEqual(0);
        expect(calculateForgingInfo(58, 14, mockGetBlockTimeLookup).nextForger).toEqual(1);
        expect(calculateForgingInfo(68, 15, mockGetBlockTimeLookup).nextForger).toEqual(3);
    });

    it("should calculate the currentForger index correctly for dynamic block times, changing max delegate numbers and missed slots", async () => {
        const milestones = [
            { height: 1, blocktime: 4, activeDelegates: 4 },
            { height: 4, blocktime: 3 },
            { height: 10, blocktime: 5, activeDelegates: 5 },
            // { height: 21, blocktime: 12, activeDelegates: 8 },
        ];

        const expectedResults = [
            { height: 1, timestamp: 0, currentForger: 0, nextForger: 1, blockTimestamp: 0, canForge: true },
            { height: 1, timestamp: 3, currentForger: 0, nextForger: 1, blockTimestamp: 0, canForge: false },
            { height: 2, timestamp: 4, currentForger: 1, nextForger: 2, blockTimestamp: 4, canForge: true },
            { height: 3, timestamp: 8, currentForger: 2, nextForger: 3, blockTimestamp: 8, canForge: true },
            { height: 4, timestamp: 12, currentForger: 3, nextForger: 0, blockTimestamp: 12, canForge: true },
            { height: 4, timestamp: 16, currentForger: 0, nextForger: 1, blockTimestamp: 15, canForge: false }, // WHY ?
            { height: 4, timestamp: 18, currentForger: 1, nextForger: 2, blockTimestamp: 18, canForge: true }, // WHY ?
            { height: 5, timestamp: 21, currentForger: 2, nextForger: 3, blockTimestamp: 21, canForge: true },
            { height: 5, timestamp: 24, currentForger: 3, nextForger: 0, blockTimestamp: 24, canForge: true },
            { height: 6, timestamp: 27, currentForger: 0, nextForger: 1, blockTimestamp: 27, canForge: true }, // WHY with the same height as next one and both can forge?
            { height: 6, timestamp: 30, currentForger: 1, nextForger: 2, blockTimestamp: 30, canForge: true },
            { height: 7, timestamp: 33, currentForger: 2, nextForger: 3, blockTimestamp: 33, canForge: true },
            { height: 8, timestamp: 36, currentForger: 3, nextForger: 0, blockTimestamp: 36, canForge: true },
            { height: 9, timestamp: 39, currentForger: 0, nextForger: 1, blockTimestamp: 39, canForge: true },
            { height: 9, timestamp: 42, currentForger: 1, nextForger: 2, blockTimestamp: 42, canForge: true },
            { height: 10, timestamp: 45, currentForger: 2, nextForger: 3, blockTimestamp: 45, canForge: true },
            { height: 10, timestamp: 49, currentForger: 2, nextForger: 3, blockTimestamp: 45, canForge: false },
            { height: 11, timestamp: 50, currentForger: 3, nextForger: 0, blockTimestamp: 50, canForge: true },
            { height: 12, timestamp: 55, currentForger: 0, nextForger: 1, blockTimestamp: 55, canForge: true },
            { height: 19, timestamp: 100, currentForger: 4, nextForger: 0, blockTimestamp: 100, canForge: true },
            { height: 19, timestamp: 105, currentForger: 0, nextForger: 1, blockTimestamp: 105, canForge: true },
        ];

        const config = { ...devnet, milestones };
        // @ts-ignore
        jest.spyOn(configManager, "validateMilestones").mockReturnValue(true);
        // @ts-ignore
        jest.spyOn(Managers.configManager, "validateMilestones").mockReturnValue(true);
        configManager.setConfig(config);
        Managers.configManager.setConfig(config);

        const mockGetBlockTimeLookup = (height: number) => {
            switch (height) {
                case 1:
                    return 0;
                case 3:
                    return 8;
                case 9:
                    return 42;
                default:
                    throw new Error(`Test scenarios should not hit this line`);
            }
        };

        expectedResults.forEach((item) => {
            expect(calculateForgingInfo(item.timestamp, item.height, mockGetBlockTimeLookup)).toEqual({
                currentForger: item.currentForger,
                nextForger: item.nextForger,
                blockTimestamp: item.blockTimestamp,
                canForge: item.canForge,
            });
        });
    });
});
