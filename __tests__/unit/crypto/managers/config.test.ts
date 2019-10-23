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
        configManager.setHeight(4006000);

        const lastVersions = devnet.milestones
            .sort((a, b) => a.height - b.height)
            .find(milestone => !!milestone.p2p && !!milestone.p2p.minimumVersions);

        if (lastVersions && !!configManager.getMilestone().p2p) {
            expect(configManager.getMilestone().p2p.minimumVersions).toEqual(lastVersions);
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
});
