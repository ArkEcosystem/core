import "jest-extended";

import { CryptoManager } from "@packages/crypto/src";

let heightTracker;

beforeAll(() => {
    const devnetCrypto = CryptoManager.createFromPreset("devnet");
    heightTracker = devnetCrypto.HeightTracker;
});

describe("HeightTracker", () => {
    it("should set and get the height correctly ", () => {
        heightTracker.setHeight(21600);

        expect(heightTracker.getHeight()).toEqual(21600);
    });
});
