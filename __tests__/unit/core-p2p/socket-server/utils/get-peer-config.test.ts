import { Managers } from "@arkecosystem/crypto";
import { getPeerConfig } from "@arkecosystem/core-p2p/src/socket-server/utils/get-peer-config";

describe("getPeerConfig", () => {
    const mockConfig = {
        "network.pubKeyHash": "pubkyhash",
        "network.name": "thechain",
        "network.nethash": "nethahs",
        "network.client.explorer": "explorer.thechain.com",
        "network.client.token": "TCHAIN",
        "network.client.symbol": "TCH",
    };
    jest.spyOn(Managers.configManager, "get").mockImplementation((key) => mockConfig[key]);

    const version = "3.0.9";
    const app = { version: () => version };

    it("should return own config from config manager", () => {
        expect(getPeerConfig(app as any)).toEqual({
            version,
            network: {
                version: mockConfig["network.pubKeyHash"],
                name: mockConfig["network.name"],
                nethash: mockConfig["network.nethash"],
                explorer: mockConfig["network.client.explorer"],
                token: {
                    name: mockConfig["network.client.token"],
                    symbol: mockConfig["network.client.symbol"],
                },
            },
            plugins: {},
        });
    });
});
