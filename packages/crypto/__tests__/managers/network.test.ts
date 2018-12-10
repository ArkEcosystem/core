import "jest-extended";

import { NetworkManager } from "../../src/managers/network";
import networkMainnet from "../../src/networks/ark/mainnet.json";

describe("Network Manager", () => {
    it("should be instantiated", () => {
        expect(NetworkManager).toBeDefined();
    });

    it("should find mainnet by name", () => {
        const mainnet = NetworkManager.findByName("mainnet");
        expect(mainnet).toMatchObject(networkMainnet);
    });
});
