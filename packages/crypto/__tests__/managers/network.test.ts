import "jest-extended";

import { NetworkManager } from "../../src/managers/network";
import * as networks from "../../src/networks";

describe("Network Manager", () => {
    it("should be instantiated", () => {
        expect(NetworkManager).toBeDefined();
    });

    it("should find mainnet by name", () => {
        const actual = NetworkManager.findByName("mainnet");
        expect(actual).toMatchObject(networks.mainnet);
    });

    it("should get all networks", () => {
        const all = NetworkManager.getAll();
        expect(all).toEqual(networks);
    });
});
