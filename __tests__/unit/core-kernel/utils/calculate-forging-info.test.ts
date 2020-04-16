import "jest-extended";

import { Utils } from "@packages/core-kernel";
import { calculateForgingInfo } from "@packages/core-kernel/src/utils/calculate-forging-info";
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

describe("calculateForgingInfo", () => {
    it("should throw is the current height is higher than the round's end", () => {
        const milestones = [{ height: 1, blocktime: 8, activeDelegates: 4 }];

        const config = { ...devnet, milestones };
        configManager.setConfig(config);
        Managers.configManager.setConfig(config);

        const mockRoundInfo = { maxDelegates: 4, roundHeight: 4 };
        const height = 9;
        // @ts-ignore
        expect(() => calculateForgingInfo(22, height, mockRoundInfo, mockGetBlockTimeLookup)).toThrow(
            `Cannot calculate currentForger: height ${height} should not appear in round ${mockRoundInfo.roundHeight}`,
        );
    });

    it("should calculate the current forging index correctly for fixed block times", async () => {
        const milestones = [{ height: 1, blocktime: 8, activeDelegates: 4 }];

        const config = { ...devnet, milestones };
        configManager.setConfig(config);
        Managers.configManager.setConfig(config);

        expect(
            calculateForgingInfo(0, 1, Utils.roundCalculator.calculateRound(1), mockGetBlockTimeLookup).currentForger,
        ).toEqual(0);
        expect(
            calculateForgingInfo(7, 1, Utils.roundCalculator.calculateRound(1), mockGetBlockTimeLookup).currentForger,
        ).toEqual(0);
        expect(
            calculateForgingInfo(8, 2, Utils.roundCalculator.calculateRound(2), mockGetBlockTimeLookup).currentForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(15, 2, Utils.roundCalculator.calculateRound(2), mockGetBlockTimeLookup).currentForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(16, 3, Utils.roundCalculator.calculateRound(3), mockGetBlockTimeLookup).currentForger,
        ).toEqual(2);
        expect(
            calculateForgingInfo(24, 4, Utils.roundCalculator.calculateRound(4), mockGetBlockTimeLookup).currentForger,
        ).toEqual(3);
        expect(
            calculateForgingInfo(32, 5, Utils.roundCalculator.calculateRound(5), mockGetBlockTimeLookup).currentForger,
        ).toEqual(0);
        expect(
            calculateForgingInfo(40, 6, Utils.roundCalculator.calculateRound(6), mockGetBlockTimeLookup).currentForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(48, 7, Utils.roundCalculator.calculateRound(7), mockGetBlockTimeLookup).currentForger,
        ).toEqual(2);
        expect(
            calculateForgingInfo(56, 8, Utils.roundCalculator.calculateRound(8), mockGetBlockTimeLookup).currentForger,
        ).toEqual(3);
        expect(
            calculateForgingInfo(64, 9, Utils.roundCalculator.calculateRound(9), mockGetBlockTimeLookup).currentForger,
        ).toEqual(0);
    });

    it("should calculate the blockTimestamp from fixed block times", async () => {
        const milestones = [{ height: 1, blocktime: 8, activeDelegates: 4 }];

        const config = { ...devnet, milestones };
        configManager.setConfig(config);
        Managers.configManager.setConfig(config);

        expect(
            calculateForgingInfo(0, 1, Utils.roundCalculator.calculateRound(1), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(0);
        expect(
            calculateForgingInfo(7, 1, Utils.roundCalculator.calculateRound(1), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(0);
        expect(
            calculateForgingInfo(8, 2, Utils.roundCalculator.calculateRound(2), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(8);
        expect(
            calculateForgingInfo(15, 2, Utils.roundCalculator.calculateRound(2), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(8);
        expect(
            calculateForgingInfo(16, 3, Utils.roundCalculator.calculateRound(3), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(16);
        expect(
            calculateForgingInfo(24, 4, Utils.roundCalculator.calculateRound(4), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(24);
        expect(
            calculateForgingInfo(32, 5, Utils.roundCalculator.calculateRound(5), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(32);
        expect(
            calculateForgingInfo(40, 6, Utils.roundCalculator.calculateRound(6), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(40);
        expect(
            calculateForgingInfo(48, 7, Utils.roundCalculator.calculateRound(7), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(48);
        expect(
            calculateForgingInfo(56, 8, Utils.roundCalculator.calculateRound(8), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(56);
        expect(
            calculateForgingInfo(64, 9, Utils.roundCalculator.calculateRound(9), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(64);
    });

    it("should calculate the next forging index correctly for fixed block times", async () => {
        const milestones = [{ height: 1, blocktime: 8, activeDelegates: 4 }];

        const config = { ...devnet, milestones };
        configManager.setConfig(config);
        Managers.configManager.setConfig(config);

        expect(
            calculateForgingInfo(0, 1, Utils.roundCalculator.calculateRound(1), mockGetBlockTimeLookup).nextForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(7, 1, Utils.roundCalculator.calculateRound(1), mockGetBlockTimeLookup).nextForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(8, 2, Utils.roundCalculator.calculateRound(2), mockGetBlockTimeLookup).nextForger,
        ).toEqual(2);
        expect(
            calculateForgingInfo(15, 2, Utils.roundCalculator.calculateRound(2), mockGetBlockTimeLookup).nextForger,
        ).toEqual(2);
        expect(
            calculateForgingInfo(16, 3, Utils.roundCalculator.calculateRound(3), mockGetBlockTimeLookup).nextForger,
        ).toEqual(3);
        expect(
            calculateForgingInfo(24, 4, Utils.roundCalculator.calculateRound(4), mockGetBlockTimeLookup).nextForger,
        ).toEqual(0);
        expect(
            calculateForgingInfo(32, 5, Utils.roundCalculator.calculateRound(5), mockGetBlockTimeLookup).nextForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(40, 6, Utils.roundCalculator.calculateRound(6), mockGetBlockTimeLookup).nextForger,
        ).toEqual(2);
        expect(
            calculateForgingInfo(48, 7, Utils.roundCalculator.calculateRound(7), mockGetBlockTimeLookup).nextForger,
        ).toEqual(3);
        expect(
            calculateForgingInfo(56, 8, Utils.roundCalculator.calculateRound(8), mockGetBlockTimeLookup).nextForger,
        ).toEqual(0);
        expect(
            calculateForgingInfo(64, 9, Utils.roundCalculator.calculateRound(9), mockGetBlockTimeLookup).nextForger,
        ).toEqual(1);
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

        expect(
            calculateForgingInfo(0, 1, Utils.roundCalculator.calculateRound(1), mockGetBlockTimeLookup).currentForger,
        ).toEqual(0);
        expect(
            calculateForgingInfo(7, 1, Utils.roundCalculator.calculateRound(1), mockGetBlockTimeLookup).currentForger,
        ).toEqual(0);
        expect(
            calculateForgingInfo(8, 2, Utils.roundCalculator.calculateRound(2), mockGetBlockTimeLookup).currentForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(11, 2, Utils.roundCalculator.calculateRound(2), mockGetBlockTimeLookup).currentForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(12, 3, Utils.roundCalculator.calculateRound(3), mockGetBlockTimeLookup).currentForger,
        ).toEqual(2);
        expect(
            calculateForgingInfo(16, 4, Utils.roundCalculator.calculateRound(4), mockGetBlockTimeLookup).currentForger,
        ).toEqual(3);
        expect(
            calculateForgingInfo(19, 5, Utils.roundCalculator.calculateRound(5), mockGetBlockTimeLookup).currentForger,
        ).toEqual(0);
        expect(
            calculateForgingInfo(22, 6, Utils.roundCalculator.calculateRound(6), mockGetBlockTimeLookup).currentForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(26, 7, Utils.roundCalculator.calculateRound(7), mockGetBlockTimeLookup).currentForger,
        ).toEqual(2);
        expect(
            calculateForgingInfo(30, 8, Utils.roundCalculator.calculateRound(8), mockGetBlockTimeLookup).currentForger,
        ).toEqual(3);
        expect(
            calculateForgingInfo(34, 9, Utils.roundCalculator.calculateRound(9), mockGetBlockTimeLookup).currentForger,
        ).toEqual(0);
        expect(
            calculateForgingInfo(38, 10, Utils.roundCalculator.calculateRound(10), mockGetBlockTimeLookup)
                .currentForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(46, 12, Utils.roundCalculator.calculateRound(12), mockGetBlockTimeLookup)
                .currentForger,
        ).toEqual(3);
        expect(
            calculateForgingInfo(54, 14, Utils.roundCalculator.calculateRound(14), mockGetBlockTimeLookup)
                .currentForger,
        ).toEqual(1);
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

        expect(
            calculateForgingInfo(0, 1, Utils.roundCalculator.calculateRound(1), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(0);
        expect(
            calculateForgingInfo(7, 1, Utils.roundCalculator.calculateRound(1), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(0);

        expect(
            calculateForgingInfo(8, 2, Utils.roundCalculator.calculateRound(2), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(8);
        expect(
            calculateForgingInfo(11, 2, Utils.roundCalculator.calculateRound(2), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(8);

        expect(
            calculateForgingInfo(12, 3, Utils.roundCalculator.calculateRound(3), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(12);
        expect(
            calculateForgingInfo(15, 3, Utils.roundCalculator.calculateRound(3), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(12);
        expect(
            calculateForgingInfo(16, 4, Utils.roundCalculator.calculateRound(4), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(16);
        expect(
            calculateForgingInfo(17, 4, Utils.roundCalculator.calculateRound(4), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(16);

        expect(
            calculateForgingInfo(19, 5, Utils.roundCalculator.calculateRound(5), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(19);
        expect(
            calculateForgingInfo(21, 5, Utils.roundCalculator.calculateRound(5), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(19);
        expect(
            calculateForgingInfo(22, 6, Utils.roundCalculator.calculateRound(6), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(22);
        expect(
            calculateForgingInfo(25, 6, Utils.roundCalculator.calculateRound(6), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(22);

        expect(
            calculateForgingInfo(26, 7, Utils.roundCalculator.calculateRound(7), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(26);
        expect(
            calculateForgingInfo(29, 7, Utils.roundCalculator.calculateRound(7), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(26);

        expect(
            calculateForgingInfo(30, 8, Utils.roundCalculator.calculateRound(8), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(30);
        expect(
            calculateForgingInfo(33, 8, Utils.roundCalculator.calculateRound(8), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(30);

        expect(
            calculateForgingInfo(34, 9, Utils.roundCalculator.calculateRound(9), mockGetBlockTimeLookup).blockTimestamp,
        ).toEqual(34);
        expect(
            calculateForgingInfo(38, 10, Utils.roundCalculator.calculateRound(10), mockGetBlockTimeLookup)
                .blockTimestamp,
        ).toEqual(38);
        expect(
            calculateForgingInfo(46, 12, Utils.roundCalculator.calculateRound(12), mockGetBlockTimeLookup)
                .blockTimestamp,
        ).toEqual(46);

        expect(
            calculateForgingInfo(53, 12, Utils.roundCalculator.calculateRound(12), mockGetBlockTimeLookup)
                .blockTimestamp,
        ).toEqual(50);
        expect(
            calculateForgingInfo(54, 14, Utils.roundCalculator.calculateRound(14), mockGetBlockTimeLookup)
                .blockTimestamp,
        ).toEqual(54);
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

        expect(
            calculateForgingInfo(0, 1, Utils.roundCalculator.calculateRound(1), mockGetBlockTimeLookup).nextForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(7, 1, Utils.roundCalculator.calculateRound(1), mockGetBlockTimeLookup).nextForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(8, 2, Utils.roundCalculator.calculateRound(2), mockGetBlockTimeLookup).nextForger,
        ).toEqual(2);
        expect(
            calculateForgingInfo(11, 2, Utils.roundCalculator.calculateRound(2), mockGetBlockTimeLookup).nextForger,
        ).toEqual(2);
        expect(
            calculateForgingInfo(12, 3, Utils.roundCalculator.calculateRound(3), mockGetBlockTimeLookup).nextForger,
        ).toEqual(3);
        expect(
            calculateForgingInfo(16, 4, Utils.roundCalculator.calculateRound(4), mockGetBlockTimeLookup).nextForger,
        ).toEqual(0);
        expect(
            calculateForgingInfo(19, 5, Utils.roundCalculator.calculateRound(5), mockGetBlockTimeLookup).nextForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(22, 6, Utils.roundCalculator.calculateRound(6), mockGetBlockTimeLookup).nextForger,
        ).toEqual(2);
        expect(
            calculateForgingInfo(26, 7, Utils.roundCalculator.calculateRound(7), mockGetBlockTimeLookup).nextForger,
        ).toEqual(3);
        expect(
            calculateForgingInfo(30, 8, Utils.roundCalculator.calculateRound(8), mockGetBlockTimeLookup).nextForger,
        ).toEqual(0);
        expect(
            calculateForgingInfo(34, 9, Utils.roundCalculator.calculateRound(9), mockGetBlockTimeLookup).nextForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(38, 10, Utils.roundCalculator.calculateRound(10), mockGetBlockTimeLookup).nextForger,
        ).toEqual(2);
        expect(
            calculateForgingInfo(46, 12, Utils.roundCalculator.calculateRound(12), mockGetBlockTimeLookup).nextForger,
        ).toEqual(0);
        expect(
            calculateForgingInfo(54, 14, Utils.roundCalculator.calculateRound(14), mockGetBlockTimeLookup).nextForger,
        ).toEqual(2);
    });

    it("should calculate the currentForger index correctly for dynamic block times and changing max delegate numbers", async () => {
        const milestones = [
            { height: 1, blocktime: 8, activeDelegates: 4 },
            { height: 2, blocktime: 4 },
            { height: 4, blocktime: 3 },
            { height: 5, blocktime: 5, activeDelegates: 5 },
            { height: 15, activeDelegates: 3 },
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
                case 0:
                    return 0;
                case 1:
                    return 8;
                case 3:
                    return 12;
                case 4:
                    return 19;
                default:
                    throw new Error(`Test scenarios should not hit this line`);
            }
        };

        expect(
            calculateForgingInfo(0, 1, Utils.roundCalculator.calculateRound(1), mockGetBlockTimeLookup).currentForger,
        ).toEqual(0);
        expect(
            calculateForgingInfo(7, 1, Utils.roundCalculator.calculateRound(1), mockGetBlockTimeLookup).currentForger,
        ).toEqual(0);
        expect(
            calculateForgingInfo(8, 2, Utils.roundCalculator.calculateRound(2), mockGetBlockTimeLookup).currentForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(11, 2, Utils.roundCalculator.calculateRound(2), mockGetBlockTimeLookup).currentForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(12, 3, Utils.roundCalculator.calculateRound(3), mockGetBlockTimeLookup).currentForger,
        ).toEqual(2);
        expect(
            calculateForgingInfo(15, 3, Utils.roundCalculator.calculateRound(3), mockGetBlockTimeLookup).currentForger,
        ).toEqual(2);
        expect(
            calculateForgingInfo(16, 4, Utils.roundCalculator.calculateRound(4), mockGetBlockTimeLookup).currentForger,
        ).toEqual(3);
        expect(
            calculateForgingInfo(18, 4, Utils.roundCalculator.calculateRound(4), mockGetBlockTimeLookup).currentForger,
        ).toEqual(3);
        expect(
            calculateForgingInfo(19, 5, Utils.roundCalculator.calculateRound(5), mockGetBlockTimeLookup).currentForger,
        ).toEqual(0);
        expect(
            calculateForgingInfo(23, 5, Utils.roundCalculator.calculateRound(5), mockGetBlockTimeLookup).currentForger,
        ).toEqual(0);
        expect(
            calculateForgingInfo(24, 6, Utils.roundCalculator.calculateRound(6), mockGetBlockTimeLookup).currentForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(29, 7, Utils.roundCalculator.calculateRound(7), mockGetBlockTimeLookup).currentForger,
        ).toEqual(2);
        expect(
            calculateForgingInfo(33, 7, Utils.roundCalculator.calculateRound(7), mockGetBlockTimeLookup).currentForger,
        ).toEqual(2);
        expect(
            calculateForgingInfo(34, 8, Utils.roundCalculator.calculateRound(8), mockGetBlockTimeLookup).currentForger,
        ).toEqual(3);
        expect(
            calculateForgingInfo(39, 9, Utils.roundCalculator.calculateRound(9), mockGetBlockTimeLookup).currentForger,
        ).toEqual(4);
        expect(
            calculateForgingInfo(44, 10, Utils.roundCalculator.calculateRound(10), mockGetBlockTimeLookup)
                .currentForger,
        ).toEqual(0);
        expect(
            calculateForgingInfo(49, 11, Utils.roundCalculator.calculateRound(11), mockGetBlockTimeLookup)
                .currentForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(64, 14, Utils.roundCalculator.calculateRound(14), mockGetBlockTimeLookup)
                .currentForger,
        ).toEqual(4);
        expect(
            calculateForgingInfo(69, 15, Utils.roundCalculator.calculateRound(15), mockGetBlockTimeLookup)
                .currentForger,
        ).toEqual(0);
        expect(
            calculateForgingInfo(74, 16, Utils.roundCalculator.calculateRound(16), mockGetBlockTimeLookup)
                .currentForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(79, 17, Utils.roundCalculator.calculateRound(17), mockGetBlockTimeLookup)
                .currentForger,
        ).toEqual(2);
        expect(
            calculateForgingInfo(84, 18, Utils.roundCalculator.calculateRound(18), mockGetBlockTimeLookup)
                .currentForger,
        ).toEqual(0);
    });

    it("should calculate the nextForger index correctly for dynamic block times and changing max delegate numbers", async () => {
        const milestones = [
            { height: 1, blocktime: 8, activeDelegates: 4 },
            { height: 2, blocktime: 4 },
            { height: 4, blocktime: 3 },
            { height: 5, blocktime: 5, activeDelegates: 5 },
            { height: 15, activeDelegates: 3 },
        ];

        const mockGetBlockTimeLookup = (height: number) => {
            switch (height) {
                case 0:
                    return 0;
                case 1:
                    return 8;
                case 3:
                    return 12;
                case 4:
                    return 16;
                case 14:
                    return 64;
                default:
                    throw new Error(`Test scenarios should not hit this line`);
            }
        };

        const config = { ...devnet, milestones };
        // @ts-ignore
        jest.spyOn(configManager, "validateMilestones").mockReturnValue(true);
        // @ts-ignore
        jest.spyOn(Managers.configManager, "validateMilestones").mockReturnValue(true);
        configManager.setConfig(config);
        Managers.configManager.setConfig(config);

        expect(
            calculateForgingInfo(0, 1, Utils.roundCalculator.calculateRound(1), mockGetBlockTimeLookup).nextForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(7, 1, Utils.roundCalculator.calculateRound(1), mockGetBlockTimeLookup).nextForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(8, 2, Utils.roundCalculator.calculateRound(2), mockGetBlockTimeLookup).nextForger,
        ).toEqual(2);
        expect(
            calculateForgingInfo(11, 2, Utils.roundCalculator.calculateRound(2), mockGetBlockTimeLookup).nextForger,
        ).toEqual(2);
        expect(
            calculateForgingInfo(12, 3, Utils.roundCalculator.calculateRound(3), mockGetBlockTimeLookup).nextForger,
        ).toEqual(3);
        expect(
            calculateForgingInfo(15, 3, Utils.roundCalculator.calculateRound(3), mockGetBlockTimeLookup).nextForger,
        ).toEqual(3);
        expect(
            calculateForgingInfo(16, 4, Utils.roundCalculator.calculateRound(4), mockGetBlockTimeLookup).nextForger,
        ).toEqual(0);
        expect(
            calculateForgingInfo(18, 4, Utils.roundCalculator.calculateRound(4), mockGetBlockTimeLookup).nextForger,
        ).toEqual(0);
        expect(
            calculateForgingInfo(19, 5, Utils.roundCalculator.calculateRound(5), mockGetBlockTimeLookup).nextForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(23, 5, Utils.roundCalculator.calculateRound(5), mockGetBlockTimeLookup).nextForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(24, 6, Utils.roundCalculator.calculateRound(6), mockGetBlockTimeLookup).nextForger,
        ).toEqual(2);
        expect(
            calculateForgingInfo(29, 7, Utils.roundCalculator.calculateRound(7), mockGetBlockTimeLookup).nextForger,
        ).toEqual(3);
        expect(
            calculateForgingInfo(33, 7, Utils.roundCalculator.calculateRound(7), mockGetBlockTimeLookup).nextForger,
        ).toEqual(3);
        expect(
            calculateForgingInfo(34, 8, Utils.roundCalculator.calculateRound(8), mockGetBlockTimeLookup).nextForger,
        ).toEqual(4);
        expect(
            calculateForgingInfo(39, 9, Utils.roundCalculator.calculateRound(9), mockGetBlockTimeLookup).nextForger,
        ).toEqual(0);
        expect(
            calculateForgingInfo(44, 10, Utils.roundCalculator.calculateRound(10), mockGetBlockTimeLookup).nextForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(49, 11, Utils.roundCalculator.calculateRound(11), mockGetBlockTimeLookup).nextForger,
        ).toEqual(2);
        expect(
            calculateForgingInfo(69, 15, Utils.roundCalculator.calculateRound(15), mockGetBlockTimeLookup).nextForger,
        ).toEqual(1);
        expect(
            calculateForgingInfo(74, 16, Utils.roundCalculator.calculateRound(16), mockGetBlockTimeLookup).nextForger,
        ).toEqual(2);
        expect(
            calculateForgingInfo(79, 17, Utils.roundCalculator.calculateRound(17), mockGetBlockTimeLookup).nextForger,
        ).toEqual(0);
        expect(
            calculateForgingInfo(84, 18, Utils.roundCalculator.calculateRound(18), mockGetBlockTimeLookup).nextForger,
        ).toEqual(1);
    });

    it("should calculate the currentForger index correctly for dynamic block times, changing max delegate numbers and missed slots", async () => {
        const milestones = [
            { height: 1, blocktime: 4, activeDelegates: 4 },
            { height: 4, blocktime: 3 },
            { height: 10, blocktime: 5, activeDelegates: 5 },
        ];

        const config = { ...devnet, milestones };
        // @ts-ignore
        jest.spyOn(configManager, "validateMilestones").mockReturnValue(true);
        // @ts-ignore
        jest.spyOn(Managers.configManager, "validateMilestones").mockReturnValue(true);
        configManager.setConfig(config);
        Managers.configManager.setConfig(config);

        const mockGetBlockTimeLookup = (height: number) => {
            console.log("Looking up height: ", height);
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

        expect(calculateForgingInfo(0, 1, Utils.roundCalculator.calculateRound(1), mockGetBlockTimeLookup)).toEqual(
            expect.objectContaining({
                currentForger: 0,
                nextForger: 1,
                blockTimestamp: 0,
                canForge: true,
            }),
        );

        expect(calculateForgingInfo(3, 1, Utils.roundCalculator.calculateRound(1), mockGetBlockTimeLookup)).toEqual(
            expect.objectContaining({
                currentForger: 0,
                nextForger: 1,
                blockTimestamp: 0,
                canForge: false,
            }),
        );

        expect(calculateForgingInfo(4, 2, Utils.roundCalculator.calculateRound(1), mockGetBlockTimeLookup)).toEqual(
            expect.objectContaining({
                currentForger: 1,
                nextForger: 2,
                blockTimestamp: 4,
                canForge: true,
            }),
        );

        expect(calculateForgingInfo(8, 3, Utils.roundCalculator.calculateRound(1), mockGetBlockTimeLookup)).toEqual(
            expect.objectContaining({
                currentForger: 2,
                nextForger: 3,
                blockTimestamp: 8,
                canForge: true,
            }),
        );

        expect(calculateForgingInfo(12, 4, Utils.roundCalculator.calculateRound(1), mockGetBlockTimeLookup)).toEqual(
            expect.objectContaining({
                currentForger: 3,
                nextForger: 0,
                blockTimestamp: 12,
                canForge: true,
            }),
        );

        expect(calculateForgingInfo(16, 4, Utils.roundCalculator.calculateRound(2), mockGetBlockTimeLookup)).toEqual(
            expect.objectContaining({
                currentForger: 0,
                nextForger: 1,
                blockTimestamp: 15,
                canForge: false,
            }),
        );

        expect(calculateForgingInfo(18, 4, Utils.roundCalculator.calculateRound(2), mockGetBlockTimeLookup)).toEqual(
            expect.objectContaining({
                currentForger: 1,
                nextForger: 2,
                blockTimestamp: 18,
            }),
        );

        expect(calculateForgingInfo(21, 5, Utils.roundCalculator.calculateRound(2), mockGetBlockTimeLookup)).toEqual(
            expect.objectContaining({
                currentForger: 2,
                nextForger: 3,
                blockTimestamp: 21,
            }),
        );

        expect(calculateForgingInfo(24, 5, Utils.roundCalculator.calculateRound(2), mockGetBlockTimeLookup)).toEqual(
            expect.objectContaining({
                currentForger: 3,
                nextForger: 0,
                blockTimestamp: 24,
            }),
        );

        expect(calculateForgingInfo(27, 6, Utils.roundCalculator.calculateRound(3), mockGetBlockTimeLookup)).toEqual(
            expect.objectContaining({
                currentForger: 0,
                nextForger: 1,
                blockTimestamp: 27,
            }),
        );

        expect(calculateForgingInfo(30, 6, Utils.roundCalculator.calculateRound(3), mockGetBlockTimeLookup)).toEqual(
            expect.objectContaining({
                currentForger: 1,
                nextForger: 2,
                blockTimestamp: 30,
            }),
        );

        expect(calculateForgingInfo(33, 7, Utils.roundCalculator.calculateRound(3), mockGetBlockTimeLookup)).toEqual(
            expect.objectContaining({
                currentForger: 2,
                nextForger: 3,
                blockTimestamp: 33,
            }),
        );

        expect(calculateForgingInfo(36, 8, Utils.roundCalculator.calculateRound(3), mockGetBlockTimeLookup)).toEqual(
            expect.objectContaining({
                currentForger: 3,
                nextForger: 0,
                blockTimestamp: 36,
            }),
        );

        expect(calculateForgingInfo(39, 9, Utils.roundCalculator.calculateRound(4), mockGetBlockTimeLookup)).toEqual(
            expect.objectContaining({
                currentForger: 0,
                nextForger: 1,
                blockTimestamp: 39,
            }),
        );

        expect(calculateForgingInfo(42, 9, Utils.roundCalculator.calculateRound(4), mockGetBlockTimeLookup)).toEqual(
            expect.objectContaining({
                currentForger: 1,
                nextForger: 2,
                blockTimestamp: 42,
            }),
        );

        expect(calculateForgingInfo(45, 10, Utils.roundCalculator.calculateRound(4), mockGetBlockTimeLookup)).toEqual(
            expect.objectContaining({
                currentForger: 2,
                nextForger: 3,
                blockTimestamp: 45,
            }),
        );

        expect(calculateForgingInfo(50, 11, Utils.roundCalculator.calculateRound(4), mockGetBlockTimeLookup)).toEqual(
            expect.objectContaining({
                currentForger: 3,
                nextForger: 0,
                blockTimestamp: 50,
            }),
        );

        expect(calculateForgingInfo(55, 12, Utils.roundCalculator.calculateRound(5), mockGetBlockTimeLookup)).toEqual(
            expect.objectContaining({
                currentForger: 0,
                nextForger: 1,
                blockTimestamp: 55,
            }),
        );

        expect(calculateForgingInfo(100, 19, Utils.roundCalculator.calculateRound(6), mockGetBlockTimeLookup)).toEqual(
            expect.objectContaining({
                currentForger: 4,
                nextForger: 0,
                blockTimestamp: 100,
            }),
        );

        expect(calculateForgingInfo(105, 19, Utils.roundCalculator.calculateRound(7), mockGetBlockTimeLookup)).toEqual(
            expect.objectContaining({
                currentForger: 0,
                nextForger: 1,
                blockTimestamp: 105,
            }),
        );
    });
});
