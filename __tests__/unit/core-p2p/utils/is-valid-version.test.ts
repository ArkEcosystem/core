import "jest-extended";

import { isValidVersion } from "@arkecosystem/core-p2p/src/utils/is-valid-version";
import { Peer } from "@arkecosystem/core-p2p/src/peer";
import { Managers } from "@arkecosystem/crypto";

let peerMock: Peer;
const getOptional = jest.fn().mockReturnValue([]);
const app = {
    getTagged: jest.fn().mockReturnValue({
        getOptional,
    }),
    get: jest.fn().mockReturnValue("mainnet"),
} as any;
beforeEach(async () => {
    peerMock = new Peer("1.0.0.99", 4002);
});

describe("isValidVersion", () => {
    it("should return false if version is not defined", () => {
        expect(isValidVersion(app, peerMock)).toBeFalse();
    });

    it.each(["a", "3", "3.6", "-3.4.0", "3.0.0.next.1"])("should return false if version is not valid", (version) => {
        peerMock.version = version;
        expect(isValidVersion(app, peerMock)).toBeFalse();
    });

    it.each(["3.0.0", "3.0.0-next.1"])("should return true if minVersion is not set", (version) => {
        peerMock.version = version;
        expect(isValidVersion(app, peerMock)).toBeTrue();
    });

    const tests = [
        { network: "mainnet", version: "3.0.0", minVersion: ["3.0.0"], result: true },
        { network: "mainnet", version: "3.0.0", minVersion: ["3.0.0", "2.0.0"], result: true },
        { network: "mainnet", version: "4.0.0", minVersion: [">=3.0.0 || <=5.0.0"], result: true },
        { network: "mainnet", version: "3.0.1", minVersion: ["3.0.0"], result: false },
        { network: "mainnet", version: "3.0.13", minVersion: [">=3.0.0"], result: true },
        { network: "mainnet", version: "4.0.0", minVersion: [">=3.0.0"], result: true },
        { network: "mainnet", version: "3.3.3", minVersion: ["^3.0.0"], result: true },
        { network: "mainnet", version: "4.0.0", minVersion: ["^3.0.0"], result: false },
        { network: "mainnet", version: "4.0.0-next.1", minVersion: [">=3.0.0"], result: false },
        { network: "devnet", version: "4.0.0-next.1", minVersion: [">=3.0.0"], result: true },
        { network: "mainnet", version: "3.0.0", minVersion: [], result: true },
    ];
    it.each(tests)("minVersion in milestones", (test) => {
        const spyGet = jest.spyOn(Managers.configManager, "get").mockReturnValue(test.network);
        const spyGetMilestone = jest.spyOn(Managers.configManager, "getMilestone").mockReturnValue({
            p2p: {
                minimumVersions: test.minVersion,
            },
        });

        peerMock.version = test.version;
        expect(isValidVersion(app, peerMock)).toEqual(test.result);
        expect(spyGet).toBeCalled();
        expect(spyGetMilestone).toBeCalled();
    });

    it.each(tests)("minVersion in config", (test) => {
        const spyGet = jest.spyOn(Managers.configManager, "get").mockReturnValue(test.network);
        getOptional.mockReturnValue(test.minVersion);

        peerMock.version = test.version;
        expect(isValidVersion(app, peerMock)).toEqual(test.result);
        expect(spyGet).toBeCalled();
        expect(getOptional).toBeCalled();
    });

    it.each([
        {
            network: "mainnet",
            version: "3.0.0",
            minConfigVersion: ["3.0.0"],
            minMilestonesVersion: ["3.0.0"],
            result: true,
        },
        {
            network: "mainnet",
            version: "3.0.0",
            minConfigVersion: ["4.0.0"],
            minMilestonesVersion: ["3.0.0"],
            result: false,
        },
        {
            network: "mainnet",
            version: "3.0.0",
            minConfigVersion: ["3.0.0"],
            minMilestonesVersion: ["4.0.0"],
            result: false,
        },
    ])("should pass configuration and milestone minVersion", (test) => {
        const spyGet = jest.spyOn(Managers.configManager, "get").mockReturnValue(test.network);
        const spyGetMilestone = jest.spyOn(Managers.configManager, "getMilestone").mockReturnValue({
            p2p: {
                minimumVersions: test.minMilestonesVersion,
            },
        });
        getOptional.mockReturnValue(test.minConfigVersion);

        peerMock.version = test.version;
        expect(isValidVersion(app, peerMock)).toEqual(test.result);
        expect(spyGet).toBeCalled();
        expect(spyGetMilestone).toBeCalled();
        expect(getOptional).toBeCalled();
    });
});
