import "jest-extended";

import { isValidVersion } from "@arkecosystem/core-p2p/src/utils/is-valid-version";
import { Peer } from "@arkecosystem/core-p2p/src/peer";
import { Managers } from "@arkecosystem/crypto";

let peerMock: Peer;
const app = {
    getTagged: jest.fn().mockReturnValue({
        getOptional: jest.fn().mockReturnValue(["^2.6.0"]),
    }),
} as any;
beforeEach(async () => {
    peerMock = new Peer("1.0.0.99", 4002);
});

describe.each([[true], [false]])("isValidVersion", (withMilestones) => {
    let spyGetMilestone = jest.spyOn(Managers.configManager, "getMilestone");
    beforeEach(() => {
        if (withMilestones) {
            spyGetMilestone = jest.spyOn(Managers.configManager, "getMilestone").mockReturnValue({
                p2p: {
                    minimumVersions: ["^2.6.0"]
                }
            });
        }
    })
    afterEach(() => {
        spyGetMilestone.mockRestore();
    })
    
    it.each([["2.6.0"], ["2.6.666"], ["2.7.0"], ["2.8.0"], ["2.9.0"], ["2.9.934"]])(
        "should be a valid version",
        (version) => {
            peerMock.version = version;
            expect(isValidVersion(app, peerMock)).toBeTrue();
        },
    );

    it.each([
        [undefined]
        ["2.4.0"],
        ["2.5.0"],
        ["1.0.0"],
        ["---aaa"],
        ["2490"],
        [2],
        [-10.2],
        [{}],
        [true],
        [() => 1],
        ["2.0.0.0"],
    ])("should be an invalid version", (version: any) => {
        peerMock.version = version;
        expect(isValidVersion(app, peerMock)).toBeFalse();
    });
});
