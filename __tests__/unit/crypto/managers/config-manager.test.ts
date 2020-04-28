import "jest-extended";

import { CryptoManager } from "@packages/crypto/src";

let configManagerDevnet;
let configManagerMainnet;

beforeAll(() => {
    const devnetCrypto = CryptoManager.createFromPreset("devnet");
    configManagerDevnet = devnetCrypto.configManager;

    const mainnetCrypto = CryptoManager.createFromPreset("mainnet");
    configManagerMainnet = mainnetCrypto.configManager;
});

describe("ConfigManager", () => {
    it("should be instantiated", () => {
        expect(configManagerDevnet).toBeObject();
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
