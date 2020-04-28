import "jest-extended";

import { NetworkManager } from "@packages/crypto/src/managers/network-manager";
import * as networks from "@packages/crypto/src/networks";

describe("NetworkManager", () => {
    it("should be instantiated", () => {
        expect(NetworkManager).toBeDefined();
    });

    it("should find mainnet by name", () => {
        const actual = NetworkManager.findByName("mainnet");
        expect(actual).toMatchObject(networks.mainnet);
    });

    it("should get all networks", () => {
        expect(NetworkManager.all()).toEqual(networks);
    });
});
