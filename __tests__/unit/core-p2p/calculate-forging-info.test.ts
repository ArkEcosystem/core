import "jest-extended";

import { Utils } from "@arkecosystem/core-kernel";
import { calculateForgingInfo } from "@packages/core-p2p/src/utils/calculate-forging-info";
import { Managers } from "@packages/crypto";
import { configManager } from "@packages/crypto/src/managers";
import { devnet } from "@packages/crypto/src/networks";

afterEach(() => jest.clearAllMocks());

describe("calculateForgingIndex", () => {
    it("should calculate the current forging index correctly for fixed block times", async () => {
        const milestones = [{ height: 1, blocktime: 8, activeDelegates: 4 }];

        const config = { ...devnet, milestones };
        configManager.setConfig(config);
        Managers.configManager.setConfig(config);

        expect(calculateForgingInfo(0, 1, Utils.roundCalculator.calculateRound(1)).currentForger).toEqual(0);
        expect(calculateForgingInfo(7, 1, Utils.roundCalculator.calculateRound(1)).currentForger).toEqual(0);
        expect(calculateForgingInfo(8, 2, Utils.roundCalculator.calculateRound(2)).currentForger).toEqual(1);
        expect(calculateForgingInfo(15, 2, Utils.roundCalculator.calculateRound(2)).currentForger).toEqual(1);
        expect(calculateForgingInfo(16, 3, Utils.roundCalculator.calculateRound(3)).currentForger).toEqual(2);
        expect(calculateForgingInfo(24, 4, Utils.roundCalculator.calculateRound(4)).currentForger).toEqual(3);
        expect(calculateForgingInfo(32, 5, Utils.roundCalculator.calculateRound(5)).currentForger).toEqual(0);
        expect(calculateForgingInfo(40, 6, Utils.roundCalculator.calculateRound(6)).currentForger).toEqual(1);
        expect(calculateForgingInfo(48, 7, Utils.roundCalculator.calculateRound(7)).currentForger).toEqual(2);
        expect(calculateForgingInfo(56, 8, Utils.roundCalculator.calculateRound(8)).currentForger).toEqual(3);
        expect(calculateForgingInfo(64, 9, Utils.roundCalculator.calculateRound(9)).currentForger).toEqual(0);
    });

    it("should calculate the blockTimestamp from fixed block times", async () => {
        const milestones = [{ height: 1, blocktime: 8, activeDelegates: 4 }];

        const config = { ...devnet, milestones };
        configManager.setConfig(config);
        Managers.configManager.setConfig(config);

        expect(calculateForgingInfo(0, 1, Utils.roundCalculator.calculateRound(1)).blockTimestamp).toEqual(0);
        expect(calculateForgingInfo(7, 1, Utils.roundCalculator.calculateRound(1)).blockTimestamp).toEqual(0);
        expect(calculateForgingInfo(8, 2, Utils.roundCalculator.calculateRound(2)).blockTimestamp).toEqual(8);
        expect(calculateForgingInfo(15, 2, Utils.roundCalculator.calculateRound(2)).blockTimestamp).toEqual(8);
        expect(calculateForgingInfo(16, 3, Utils.roundCalculator.calculateRound(3)).blockTimestamp).toEqual(16);
        expect(calculateForgingInfo(24, 4, Utils.roundCalculator.calculateRound(4)).blockTimestamp).toEqual(24);
        expect(calculateForgingInfo(32, 5, Utils.roundCalculator.calculateRound(5)).blockTimestamp).toEqual(32);
        expect(calculateForgingInfo(40, 6, Utils.roundCalculator.calculateRound(6)).blockTimestamp).toEqual(40);
        expect(calculateForgingInfo(48, 7, Utils.roundCalculator.calculateRound(7)).blockTimestamp).toEqual(48);
        expect(calculateForgingInfo(56, 8, Utils.roundCalculator.calculateRound(8)).blockTimestamp).toEqual(56);
        expect(calculateForgingInfo(64, 9, Utils.roundCalculator.calculateRound(9)).blockTimestamp).toEqual(64);
    });

    it("should calculate the next forging index correctly for fixed block times", async () => {
        const milestones = [{ height: 1, blocktime: 8, activeDelegates: 4 }];

        const config = { ...devnet, milestones };
        configManager.setConfig(config);
        Managers.configManager.setConfig(config);

        expect(calculateForgingInfo(0, 1, Utils.roundCalculator.calculateRound(1)).nextForger).toEqual(1);
        expect(calculateForgingInfo(7, 1, Utils.roundCalculator.calculateRound(1)).nextForger).toEqual(1);
        expect(calculateForgingInfo(8, 2, Utils.roundCalculator.calculateRound(2)).nextForger).toEqual(2);
        expect(calculateForgingInfo(15, 2, Utils.roundCalculator.calculateRound(2)).nextForger).toEqual(2);
        expect(calculateForgingInfo(16, 3, Utils.roundCalculator.calculateRound(3)).nextForger).toEqual(3);
        expect(calculateForgingInfo(24, 4, Utils.roundCalculator.calculateRound(4)).nextForger).toEqual(0);
        expect(calculateForgingInfo(32, 5, Utils.roundCalculator.calculateRound(5)).nextForger).toEqual(1);
        expect(calculateForgingInfo(40, 6, Utils.roundCalculator.calculateRound(6)).nextForger).toEqual(2);
        expect(calculateForgingInfo(48, 7, Utils.roundCalculator.calculateRound(7)).nextForger).toEqual(3);
        expect(calculateForgingInfo(56, 8, Utils.roundCalculator.calculateRound(8)).nextForger).toEqual(0);
        expect(calculateForgingInfo(64, 9, Utils.roundCalculator.calculateRound(9)).nextForger).toEqual(1);
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
        Managers.configManager.setConfig(config);

        expect(calculateForgingInfo(0, 1, Utils.roundCalculator.calculateRound(1)).currentForger).toEqual(0);
        expect(calculateForgingInfo(7, 1, Utils.roundCalculator.calculateRound(1)).currentForger).toEqual(0);
        expect(calculateForgingInfo(8, 2, Utils.roundCalculator.calculateRound(2)).currentForger).toEqual(1);
        expect(calculateForgingInfo(11, 2, Utils.roundCalculator.calculateRound(2)).currentForger).toEqual(1);
        expect(calculateForgingInfo(12, 3, Utils.roundCalculator.calculateRound(3)).currentForger).toEqual(2);
        expect(calculateForgingInfo(16, 4, Utils.roundCalculator.calculateRound(4)).currentForger).toEqual(3);
        expect(calculateForgingInfo(19, 5, Utils.roundCalculator.calculateRound(5)).currentForger).toEqual(0);
        expect(calculateForgingInfo(22, 6, Utils.roundCalculator.calculateRound(6)).currentForger).toEqual(1);
        expect(calculateForgingInfo(26, 7, Utils.roundCalculator.calculateRound(7)).currentForger).toEqual(2);
        expect(calculateForgingInfo(30, 8, Utils.roundCalculator.calculateRound(8)).currentForger).toEqual(3);
        expect(calculateForgingInfo(34, 9, Utils.roundCalculator.calculateRound(9)).currentForger).toEqual(0);
        expect(calculateForgingInfo(38, 10, Utils.roundCalculator.calculateRound(10)).currentForger).toEqual(1);
        expect(calculateForgingInfo(46, 12, Utils.roundCalculator.calculateRound(12)).currentForger).toEqual(3);
        expect(calculateForgingInfo(54, 14, Utils.roundCalculator.calculateRound(14)).currentForger).toEqual(1);
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

        expect(calculateForgingInfo(0, 1, Utils.roundCalculator.calculateRound(1)).blockTimestamp).toEqual(0);
        expect(calculateForgingInfo(7, 1, Utils.roundCalculator.calculateRound(1)).blockTimestamp).toEqual(0);

        expect(calculateForgingInfo(8, 2, Utils.roundCalculator.calculateRound(2)).blockTimestamp).toEqual(8);
        expect(calculateForgingInfo(11, 2, Utils.roundCalculator.calculateRound(2)).blockTimestamp).toEqual(8);

        expect(calculateForgingInfo(12, 3, Utils.roundCalculator.calculateRound(3)).blockTimestamp).toEqual(12);
        expect(calculateForgingInfo(15, 3, Utils.roundCalculator.calculateRound(3)).blockTimestamp).toEqual(12);
        expect(calculateForgingInfo(16, 4, Utils.roundCalculator.calculateRound(4)).blockTimestamp).toEqual(16);
        expect(calculateForgingInfo(17, 4, Utils.roundCalculator.calculateRound(4)).blockTimestamp).toEqual(16);

        expect(calculateForgingInfo(19, 5, Utils.roundCalculator.calculateRound(5)).blockTimestamp).toEqual(19);
        expect(calculateForgingInfo(21, 5, Utils.roundCalculator.calculateRound(5)).blockTimestamp).toEqual(19);
        expect(calculateForgingInfo(22, 6, Utils.roundCalculator.calculateRound(6)).blockTimestamp).toEqual(22);
        expect(calculateForgingInfo(25, 6, Utils.roundCalculator.calculateRound(6)).blockTimestamp).toEqual(22);

        expect(calculateForgingInfo(26, 7, Utils.roundCalculator.calculateRound(7)).blockTimestamp).toEqual(26);
        expect(calculateForgingInfo(29, 7, Utils.roundCalculator.calculateRound(7)).blockTimestamp).toEqual(26);

        expect(calculateForgingInfo(30, 8, Utils.roundCalculator.calculateRound(8)).blockTimestamp).toEqual(30);
        expect(calculateForgingInfo(33, 8, Utils.roundCalculator.calculateRound(8)).blockTimestamp).toEqual(30);

        expect(calculateForgingInfo(34, 9, Utils.roundCalculator.calculateRound(9)).blockTimestamp).toEqual(34);
        expect(calculateForgingInfo(38, 10, Utils.roundCalculator.calculateRound(10)).blockTimestamp).toEqual(38);
        expect(calculateForgingInfo(46, 12, Utils.roundCalculator.calculateRound(12)).blockTimestamp).toEqual(46);

        expect(calculateForgingInfo(53, 12, Utils.roundCalculator.calculateRound(12)).blockTimestamp).toEqual(50);
        expect(calculateForgingInfo(54, 14, Utils.roundCalculator.calculateRound(14)).blockTimestamp).toEqual(54);
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
        Managers.configManager.setConfig(config);

        expect(calculateForgingInfo(0, 1, Utils.roundCalculator.calculateRound(1)).nextForger).toEqual(1);
        expect(calculateForgingInfo(7, 1, Utils.roundCalculator.calculateRound(1)).nextForger).toEqual(1);
        expect(calculateForgingInfo(8, 2, Utils.roundCalculator.calculateRound(2)).nextForger).toEqual(2);
        expect(calculateForgingInfo(11, 2, Utils.roundCalculator.calculateRound(2)).nextForger).toEqual(2);
        expect(calculateForgingInfo(12, 3, Utils.roundCalculator.calculateRound(3)).nextForger).toEqual(3);
        expect(calculateForgingInfo(16, 4, Utils.roundCalculator.calculateRound(4)).nextForger).toEqual(0);
        expect(calculateForgingInfo(19, 5, Utils.roundCalculator.calculateRound(5)).nextForger).toEqual(1);
        expect(calculateForgingInfo(22, 6, Utils.roundCalculator.calculateRound(6)).nextForger).toEqual(2);
        expect(calculateForgingInfo(26, 7, Utils.roundCalculator.calculateRound(7)).nextForger).toEqual(3);
        expect(calculateForgingInfo(30, 8, Utils.roundCalculator.calculateRound(8)).nextForger).toEqual(0);
        expect(calculateForgingInfo(34, 9, Utils.roundCalculator.calculateRound(9)).nextForger).toEqual(1);
        expect(calculateForgingInfo(38, 10, Utils.roundCalculator.calculateRound(10)).nextForger).toEqual(2);
        expect(calculateForgingInfo(46, 12, Utils.roundCalculator.calculateRound(12)).nextForger).toEqual(0);
        expect(calculateForgingInfo(54, 14, Utils.roundCalculator.calculateRound(14)).nextForger).toEqual(2);
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

        expect(calculateForgingInfo(0, 1, Utils.roundCalculator.calculateRound(1)).currentForger).toEqual(0);
        expect(calculateForgingInfo(7, 1, Utils.roundCalculator.calculateRound(1)).currentForger).toEqual(0);
        expect(calculateForgingInfo(8, 2, Utils.roundCalculator.calculateRound(2)).currentForger).toEqual(1);
        expect(calculateForgingInfo(11, 2, Utils.roundCalculator.calculateRound(2)).currentForger).toEqual(1);
        expect(calculateForgingInfo(12, 3, Utils.roundCalculator.calculateRound(3)).currentForger).toEqual(2);
        expect(calculateForgingInfo(15, 3, Utils.roundCalculator.calculateRound(3)).currentForger).toEqual(2);
        expect(calculateForgingInfo(16, 4, Utils.roundCalculator.calculateRound(4)).currentForger).toEqual(3);
        expect(calculateForgingInfo(18, 4, Utils.roundCalculator.calculateRound(4)).currentForger).toEqual(3);
        expect(calculateForgingInfo(19, 5, Utils.roundCalculator.calculateRound(5)).currentForger).toEqual(0);
        expect(calculateForgingInfo(23, 5, Utils.roundCalculator.calculateRound(5)).currentForger).toEqual(0);
        expect(calculateForgingInfo(24, 6, Utils.roundCalculator.calculateRound(6)).currentForger).toEqual(1);
        expect(calculateForgingInfo(29, 7, Utils.roundCalculator.calculateRound(7)).currentForger).toEqual(2);
        expect(calculateForgingInfo(33, 7, Utils.roundCalculator.calculateRound(7)).currentForger).toEqual(2);
        expect(calculateForgingInfo(34, 8, Utils.roundCalculator.calculateRound(8)).currentForger).toEqual(3);
        expect(calculateForgingInfo(39, 9, Utils.roundCalculator.calculateRound(9)).currentForger).toEqual(4);
        expect(calculateForgingInfo(44, 10, Utils.roundCalculator.calculateRound(10)).currentForger).toEqual(0);
        expect(calculateForgingInfo(49, 11, Utils.roundCalculator.calculateRound(11)).currentForger).toEqual(1);
        expect(calculateForgingInfo(64, 14, Utils.roundCalculator.calculateRound(14)).currentForger).toEqual(4);
        expect(calculateForgingInfo(69, 15, Utils.roundCalculator.calculateRound(15)).currentForger).toEqual(0);
        expect(calculateForgingInfo(74, 16, Utils.roundCalculator.calculateRound(16)).currentForger).toEqual(1);
        expect(calculateForgingInfo(79, 17, Utils.roundCalculator.calculateRound(17)).currentForger).toEqual(2);
        expect(calculateForgingInfo(84, 18, Utils.roundCalculator.calculateRound(18)).currentForger).toEqual(0);
    });

    it("should calculate the nextForger index correctly for dynamic block times and changing max delegate numbers", async () => {
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

        expect(calculateForgingInfo(0, 1, Utils.roundCalculator.calculateRound(1)).nextForger).toEqual(1);
        expect(calculateForgingInfo(7, 1, Utils.roundCalculator.calculateRound(1)).nextForger).toEqual(1);
        expect(calculateForgingInfo(8, 2, Utils.roundCalculator.calculateRound(2)).nextForger).toEqual(2);
        expect(calculateForgingInfo(11, 2, Utils.roundCalculator.calculateRound(2)).nextForger).toEqual(2);
        expect(calculateForgingInfo(12, 3, Utils.roundCalculator.calculateRound(3)).nextForger).toEqual(3);
        expect(calculateForgingInfo(15, 3, Utils.roundCalculator.calculateRound(3)).nextForger).toEqual(3);
        expect(calculateForgingInfo(16, 4, Utils.roundCalculator.calculateRound(4)).nextForger).toEqual(0);
        expect(calculateForgingInfo(18, 4, Utils.roundCalculator.calculateRound(4)).nextForger).toEqual(0);
        expect(calculateForgingInfo(19, 5, Utils.roundCalculator.calculateRound(5)).nextForger).toEqual(1);
        expect(calculateForgingInfo(23, 5, Utils.roundCalculator.calculateRound(5)).nextForger).toEqual(1);
        expect(calculateForgingInfo(24, 6, Utils.roundCalculator.calculateRound(6)).nextForger).toEqual(2);
        expect(calculateForgingInfo(29, 7, Utils.roundCalculator.calculateRound(7)).nextForger).toEqual(3);
        expect(calculateForgingInfo(33, 7, Utils.roundCalculator.calculateRound(7)).nextForger).toEqual(3);
        expect(calculateForgingInfo(34, 8, Utils.roundCalculator.calculateRound(8)).nextForger).toEqual(4);
        expect(calculateForgingInfo(39, 9, Utils.roundCalculator.calculateRound(9)).nextForger).toEqual(0);
        expect(calculateForgingInfo(44, 10, Utils.roundCalculator.calculateRound(10)).nextForger).toEqual(1);
        expect(calculateForgingInfo(49, 11, Utils.roundCalculator.calculateRound(11)).nextForger).toEqual(2);
        expect(calculateForgingInfo(69, 15, Utils.roundCalculator.calculateRound(15)).nextForger).toEqual(1);
        expect(calculateForgingInfo(74, 16, Utils.roundCalculator.calculateRound(16)).nextForger).toEqual(2);
        expect(calculateForgingInfo(79, 17, Utils.roundCalculator.calculateRound(17)).nextForger).toEqual(0);
        expect(calculateForgingInfo(84, 18, Utils.roundCalculator.calculateRound(18)).nextForger).toEqual(1);
    });
});
