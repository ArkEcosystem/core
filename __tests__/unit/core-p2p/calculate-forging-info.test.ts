import "jest-extended";

import { calculateForgingInfo } from "@packages/core-p2p/src/utils/calculate-forging-info";
import { configManager } from "@packages/crypto/src/managers/config";
import { devnet } from "@packages/crypto/src/networks";

afterEach(() => jest.clearAllMocks());

describe("calculateForgingIndex", () => {
    it("should calculate the current forging index correctly for fixed block times", async () => {
        const milestones = [{ height: 1, blocktime: 8, activeDelegates: 4 }];

        const config = { ...devnet, milestones };
        configManager.setConfig(config);

        expect(calculateForgingInfo(0, 1, 4).currentForger).toEqual(0);
        expect(calculateForgingInfo(7, 1, 4).currentForger).toEqual(0);
        expect(calculateForgingInfo(8, 2, 4).currentForger).toEqual(1);
        expect(calculateForgingInfo(15, 2, 4).currentForger).toEqual(1);
        expect(calculateForgingInfo(16, 3, 4).currentForger).toEqual(2);
        expect(calculateForgingInfo(24, 4, 4).currentForger).toEqual(3);
        expect(calculateForgingInfo(32, 5, 4).currentForger).toEqual(0);
        expect(calculateForgingInfo(40, 6, 4).currentForger).toEqual(1);
        expect(calculateForgingInfo(48, 7, 4).currentForger).toEqual(2);
        expect(calculateForgingInfo(56, 8, 4).currentForger).toEqual(3);
        expect(calculateForgingInfo(64, 9, 4).currentForger).toEqual(0);
    });

    it("should calculate the blockTimestamp from fixed block times", async () => {
        const milestones = [{ height: 1, blocktime: 8, activeDelegates: 4 }];

        const config = { ...devnet, milestones };
        configManager.setConfig(config);

        expect(calculateForgingInfo(0, 1, 4).blockTimestamp).toEqual(0);
        expect(calculateForgingInfo(7, 1, 4).blockTimestamp).toEqual(0);
        expect(calculateForgingInfo(8, 2, 4).blockTimestamp).toEqual(8);
        expect(calculateForgingInfo(15, 2, 4).blockTimestamp).toEqual(8);
        expect(calculateForgingInfo(16, 3, 4).blockTimestamp).toEqual(16);
        expect(calculateForgingInfo(24, 4, 4).blockTimestamp).toEqual(24);
        expect(calculateForgingInfo(32, 5, 4).blockTimestamp).toEqual(32);
        expect(calculateForgingInfo(40, 6, 4).blockTimestamp).toEqual(40);
        expect(calculateForgingInfo(48, 7, 4).blockTimestamp).toEqual(48);
        expect(calculateForgingInfo(56, 8, 4).blockTimestamp).toEqual(56);
        expect(calculateForgingInfo(64, 9, 4).blockTimestamp).toEqual(64);
    });

    it("should calculate the next forging index correctly for fixed block times", async () => {
        const milestones = [{ height: 1, blocktime: 8, activeDelegates: 4 }];

        const config = { ...devnet, milestones };
        configManager.setConfig(config);

        expect(calculateForgingInfo(0, 1, 4).nextForger).toEqual(1);
        expect(calculateForgingInfo(7, 1, 4).nextForger).toEqual(1);
        expect(calculateForgingInfo(8, 2, 4).nextForger).toEqual(2);
        expect(calculateForgingInfo(15, 2, 4).nextForger).toEqual(2);
        expect(calculateForgingInfo(16, 3, 4).nextForger).toEqual(3);
        expect(calculateForgingInfo(24, 4, 4).nextForger).toEqual(0);
        expect(calculateForgingInfo(32, 5, 4).nextForger).toEqual(1);
        expect(calculateForgingInfo(40, 6, 4).nextForger).toEqual(2);
        expect(calculateForgingInfo(48, 7, 4).nextForger).toEqual(3);
        expect(calculateForgingInfo(56, 8, 4).nextForger).toEqual(0);
        expect(calculateForgingInfo(64, 9, 4).nextForger).toEqual(1);
    });

    it("should calculate the currentForger index correctly for dynamic block times", async () => {
        const milestones = [
            { height: 1, blocktime: 8, activeDelegates: 4 },
            { height: 2, blocktime: 4 },
            { height: 4, blocktime: 3 },
            { height: 6, blocktime: 4 },
        ];

        const config = { ...devnet, milestones };
        configManager.setConfig(config);

        expect(calculateForgingInfo(0, 1, 4).currentForger).toEqual(0);
        expect(calculateForgingInfo(7, 1, 4).currentForger).toEqual(0);
        expect(calculateForgingInfo(8, 2, 4).currentForger).toEqual(1);
        expect(calculateForgingInfo(11, 2, 4).currentForger).toEqual(1);
        expect(calculateForgingInfo(12, 3, 4).currentForger).toEqual(2);
        expect(calculateForgingInfo(16, 4, 4).currentForger).toEqual(3);
        expect(calculateForgingInfo(19, 5, 4).currentForger).toEqual(0);
        expect(calculateForgingInfo(22, 6, 4).currentForger).toEqual(1);
        expect(calculateForgingInfo(26, 7, 4).currentForger).toEqual(2);
        expect(calculateForgingInfo(30, 8, 4).currentForger).toEqual(3);
        expect(calculateForgingInfo(34, 9, 4).currentForger).toEqual(0);
        expect(calculateForgingInfo(38, 10, 4).currentForger).toEqual(1);
        expect(calculateForgingInfo(46, 12, 4).currentForger).toEqual(3);
        expect(calculateForgingInfo(54, 14, 4).currentForger).toEqual(1);
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

        expect(calculateForgingInfo(0, 1, 4).blockTimestamp).toEqual(0);
        expect(calculateForgingInfo(7, 1, 4).blockTimestamp).toEqual(0);
        expect(calculateForgingInfo(8, 2, 4).blockTimestamp).toEqual(8);
        expect(calculateForgingInfo(11, 2, 4).blockTimestamp).toEqual(8);
        expect(calculateForgingInfo(12, 3, 4).blockTimestamp).toEqual(12);
        expect(calculateForgingInfo(16, 4, 4).blockTimestamp).toEqual(16);
        expect(calculateForgingInfo(19, 5, 4).blockTimestamp).toEqual(19);
        expect(calculateForgingInfo(22, 6, 4).blockTimestamp).toEqual(22);
        expect(calculateForgingInfo(26, 7, 4).blockTimestamp).toEqual(26);
        expect(calculateForgingInfo(30, 8, 4).blockTimestamp).toEqual(30);
        expect(calculateForgingInfo(34, 9, 4).blockTimestamp).toEqual(34);
        expect(calculateForgingInfo(38, 10, 4).blockTimestamp).toEqual(38);
        expect(calculateForgingInfo(46, 12, 4).blockTimestamp).toEqual(46);
        expect(calculateForgingInfo(54, 14, 4).blockTimestamp).toEqual(54);
    });

    it("should calculate the nextForger index correctly for dynamic block times", async () => {
        const milestones = [
            { height: 1, blocktime: 8, activeDelegates: 4 },
            { height: 2, blocktime: 4 },
            { height: 4, blocktime: 3 },
            { height: 6, blocktime: 4 },
        ];

        const config = { ...devnet, milestones };
        configManager.setConfig(config);

        expect(calculateForgingInfo(0, 1, 4).nextForger).toEqual(1);
        expect(calculateForgingInfo(7, 1, 4).nextForger).toEqual(1);
        expect(calculateForgingInfo(8, 2, 4).nextForger).toEqual(2);
        expect(calculateForgingInfo(11, 3, 4).nextForger).toEqual(3);
        expect(calculateForgingInfo(12, 3, 4).nextForger).toEqual(3);
        expect(calculateForgingInfo(16, 4, 4).nextForger).toEqual(0);
        expect(calculateForgingInfo(19, 5, 4).nextForger).toEqual(1);
        expect(calculateForgingInfo(22, 6, 4).nextForger).toEqual(2);
        expect(calculateForgingInfo(26, 7, 4).nextForger).toEqual(3);
        expect(calculateForgingInfo(30, 8, 4).nextForger).toEqual(0);
        expect(calculateForgingInfo(34, 9, 4).nextForger).toEqual(1);
        expect(calculateForgingInfo(38, 10, 4).nextForger).toEqual(2);
        expect(calculateForgingInfo(46, 12, 4).nextForger).toEqual(0);
        expect(calculateForgingInfo(54, 14, 4).nextForger).toEqual(2);
    });

    it("should calculate the currentForger index correctly for dynamic block times and changing max delegate numbers", async () => {
        const milestones = [
            { height: 1, blocktime: 8, activeDelegates: 4 },
            { height: 2, blocktime: 4 },
            { height: 4, blocktime: 3 },
            { height: 6, blocktime: 4, activeDelegates: 5 },
        ];

        const config = { ...devnet, milestones };
        // @ts-ignore
        jest.spyOn(configManager, "validateMilestones").mockReturnValue(true);
        configManager.setConfig(config);

        expect(calculateForgingInfo(0, 1, 4).currentForger).toEqual(0);
        expect(calculateForgingInfo(7, 1, 4).currentForger).toEqual(0);
        expect(calculateForgingInfo(8, 2, 4).currentForger).toEqual(1);
        expect(calculateForgingInfo(11, 2, 4).currentForger).toEqual(1);
        expect(calculateForgingInfo(12, 3, 4).currentForger).toEqual(2);
        expect(calculateForgingInfo(16, 4, 4).currentForger).toEqual(3);
        expect(calculateForgingInfo(19, 5, 4).currentForger).toEqual(0);
        expect(calculateForgingInfo(22, 6, 5).currentForger).toEqual(1);
        expect(calculateForgingInfo(26, 7, 5).currentForger).toEqual(2);
        expect(calculateForgingInfo(30, 8, 5).currentForger).toEqual(3);
        expect(calculateForgingInfo(34, 9, 5).currentForger).toEqual(4);
        expect(calculateForgingInfo(38, 10, 5).currentForger).toEqual(0);
        expect(calculateForgingInfo(46, 12, 5).currentForger).toEqual(2);
        expect(calculateForgingInfo(54, 14, 5).currentForger).toEqual(4);
    });

    it("should calculate the nextForger index correctly for dynamic block times and changing max delegate numbers", async () => {
        const milestones = [
            { height: 1, blocktime: 8, activeDelegates: 4 },
            { height: 2, blocktime: 4 },
            { height: 4, blocktime: 3 },
            { height: 6, blocktime: 4, activeDelegates: 5 },
        ];

        const config = { ...devnet, milestones };
        // @ts-ignore
        jest.spyOn(configManager, "validateMilestones").mockReturnValue(true);
        configManager.setConfig(config);

        expect(calculateForgingInfo(0, 1, 4).nextForger).toEqual(1);
        expect(calculateForgingInfo(7, 1, 4).nextForger).toEqual(1);
        expect(calculateForgingInfo(8, 2, 4).nextForger).toEqual(2);
        expect(calculateForgingInfo(11, 2, 4).nextForger).toEqual(2);
        expect(calculateForgingInfo(12, 3, 4).nextForger).toEqual(3);
        expect(calculateForgingInfo(16, 4, 4).nextForger).toEqual(0);
        expect(calculateForgingInfo(19, 5, 4).nextForger).toEqual(1);
        expect(calculateForgingInfo(22, 6, 5).nextForger).toEqual(2);
        expect(calculateForgingInfo(26, 7, 5).nextForger).toEqual(3);
        expect(calculateForgingInfo(30, 8, 5).nextForger).toEqual(4);
        expect(calculateForgingInfo(34, 9, 5).nextForger).toEqual(0);
        expect(calculateForgingInfo(38, 10, 5).nextForger).toEqual(1);
        expect(calculateForgingInfo(46, 12, 5).nextForger).toEqual(3);
        expect(calculateForgingInfo(54, 14, 5).nextForger).toEqual(0);
    });
});
