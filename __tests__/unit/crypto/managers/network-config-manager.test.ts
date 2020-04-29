import "jest-extended";

import { CryptoManager } from "@packages/crypto/src";
import * as networks from "@packages/crypto/src/networks";

let configManagerDevnet;
let configManagerMainnet;

beforeAll(() => {
    const devnetCrypto = CryptoManager.createFromPreset("devnet");
    configManagerDevnet = devnetCrypto.NetworkConfigManager;

    const mainnetCrypto = CryptoManager.createFromPreset("mainnet");
    configManagerMainnet = mainnetCrypto.NetworkConfigManager;
});

describe("NetworkConfigManager", () => {
    it("should be instantiated", () => {
        expect(configManagerDevnet).toBeObject();
    });

    it("should get the current network", () => {
        expect(configManagerDevnet.all()).toEqual(networks.devnet);
    });

    it("should be set on runtime", () => {
        expect(configManagerMainnet.all()).toContainAllKeys(["network", "milestones", "exceptions", "genesisBlock"]);
    });

    it('key should be "set"', () => {
        configManagerDevnet.set("key", "value");

        expect(configManagerDevnet.get("key")).toBe("value");
    });

    it('key should be "get"', () => {
        expect(configManagerDevnet.get("network.nethash")).toBe(
            "2a44f340d76ffc3df204c5f38cd355b7496c9065a1ade2ef92071436bd72e867",
        );
    });
});
