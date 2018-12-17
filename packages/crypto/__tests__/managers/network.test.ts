import "jest-extended";

import { NetworkManager } from "../../src/managers/network";
import { mainnet } from "../../src/networks";

describe("Network Manager", () => {
    it("should be instantiated", () => {
        expect(NetworkManager).toBeDefined();
    });

    it("should find mainnet by name", () => {
        const actual = NetworkManager.findByName("mainnet");
        expect(actual).toMatchObject(mainnet);
    });
});
