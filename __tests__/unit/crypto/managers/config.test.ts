import "jest-extended";

import { configManager } from "../../../../packages/crypto/src/managers";
import { devnet, mainnet } from "../../../../packages/crypto/src/networks";

beforeEach(() => configManager.setConfig(devnet));

describe("Configuration", () => {
    it("should be instantiated", () => {
        expect(configManager).toBeObject();
    });

    it("should be set on runtime", () => {
        configManager.setConfig(mainnet);

        expect(configManager.all()).toContainAllKeys(["network", "milestones", "exceptions", "genesisBlock"]);
    });

    it('key should be "set"', () => {
        configManager.set("key", "value");

        expect(configManager.get("key")).toBe("value");
    });

    it('key should be "get"', () => {
        expect(configManager.get("network.nethash")).toBe(
            "2a44f340d76ffc3df204c5f38cd355b7496c9065a1ade2ef92071436bd72e867",
        );
    });

    it("should build milestones", () => {
        expect(configManager.getMilestones()).toEqual(devnet.milestones);
    });

    it('should build milestones without concatenating the "minimumVersions" array', () => {
        const milestones = devnet.milestones.sort((a, b) => a.height - b.height);
        configManager.setHeight(milestones[0].height);

        const lastMilestone = milestones.find((milestone) => !!milestone.p2p && !!milestone.p2p.minimumVersions);

        if (lastMilestone && lastMilestone.p2p && configManager.getMilestone().p2p) {
            expect(configManager.getMilestone().p2p.minimumVersions).toEqual(lastMilestone.p2p.minimumVersions);
        }
    });

    it("should get milestone for height", () => {
        expect(configManager.getMilestone(21600)).toEqual(devnet.milestones[2]);
    });

    it("should get milestone for this.height if height is not provided as parameter", () => {
        configManager.setHeight(21600);

        expect(configManager.getMilestone()).toEqual(devnet.milestones[2]);
    });

    it("should set the height", () => {
        configManager.setHeight(21600);

        expect(configManager.getHeight()).toEqual(21600);
    });

    it("should determine if a new milestone is becoming active", () => {
        for (const milestone of devnet.milestones) {
            configManager.setHeight(milestone.height);
            expect(configManager.isNewMilestone()).toBeTrue();
        }

        configManager.setHeight(999999);
        expect(configManager.isNewMilestone()).toBeFalse();

        configManager.setHeight(1);
        expect(configManager.isNewMilestone(999999)).toBeFalse();
    });

    describe("getNextMilestoneByKey", () => {
        it("should throw an error if no milestones are set", () => {
            configManager.setConfig({ ...devnet, milestones: [] });
            expect(() => configManager.getNextMilestoneWithNewKey(1, "blocktime")).toThrow(
                `Attempted to get next milestone but none were set`,
            );
        });

        it("should get the next milestone with a given key", () => {
            configManager.setConfig(devnet);
            const expected = {
                found: true,
                height: 1750000,
                data: 255,
            };
            expect(configManager.getNextMilestoneWithNewKey(1, "vendorFieldLength")).toEqual(expected);
        });

        it("should return empty result if no next milestone is found", () => {
            configManager.setConfig(devnet);
            const expected = {
                found: false,
                height: 1750000,
                data: null,
            };
            expect(configManager.getNextMilestoneWithNewKey(1750000, "vendorFieldLength")).toEqual(expected);
        });

        it("should get all milestones", () => {
            const milestones = [
                { height: 1, blocktime: 8 },
                { height: 3, blocktime: 9 },
                { height: 6, blocktime: 10 },
                { height: 8, blocktime: 8 },
            ];
            const config = { ...devnet, milestones };
            configManager.setConfig(config);
            const secondMilestone = {
                found: true,
                height: 3,
                data: 9,
            };
            const thirdMilestone = {
                found: true,
                height: 6,
                data: 10,
            };
            const fourthMilestone = {
                found: true,
                height: 8,
                data: 8,
            };
            const emptyMilestone = {
                found: false,
                height: 8,
                data: null,
            };
            expect(configManager.getNextMilestoneWithNewKey(1, "blocktime")).toEqual(secondMilestone);
            expect(configManager.getNextMilestoneWithNewKey(3, "blocktime")).toEqual(thirdMilestone);
            expect(configManager.getNextMilestoneWithNewKey(4, "blocktime")).toEqual(thirdMilestone);
            expect(configManager.getNextMilestoneWithNewKey(6, "blocktime")).toEqual(fourthMilestone);
            expect(configManager.getNextMilestoneWithNewKey(8, "blocktime")).toEqual(emptyMilestone);
        });
    });
});
