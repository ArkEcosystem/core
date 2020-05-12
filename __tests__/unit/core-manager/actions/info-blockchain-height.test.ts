import "jest-extended";

import { Action } from "@packages/core-manager/src/actions/info-blockchain-height";
import { HttpClient } from "@packages/core-manager/src/utils";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let action: Action;

let mockPeer;

beforeEach(() => {
    mockPeer = {
        ip: "0.0.0.0",
        port: 4003,
        ports: {
            "@arkecosystem/core-api": 4003,
        },
    };

    HttpClient.prototype.get = jest.fn().mockImplementation(async (path: string) => {
        if (path === "/api/blockchain") {
            return {
                data: {
                    block: {
                        height: 10,
                    },
                },
            };
        }

        // /api/peers
        return {
            data: [mockPeer],
        };
    });

    sandbox = new Sandbox();
    action = sandbox.app.resolve(Action);
});

afterEach(() => {
    delete process.env.CORE_API_DISABLED;
    jest.clearAllMocks();
});

describe("Info:BlockchainHeight", () => {
    it("should have name", () => {
        expect(action.name).toEqual("info.blockchainHeight");
    });

    it("should return height and random node height", async () => {
        mockPeer.ports["@arkecosystem/core-api"] = 8443;

        const result = await action.execute({});

        expect(result).toEqual({ height: 10, randomNodeHeight: 10, randomNodeIp: "0.0.0.0" });
    });

    it("should return height and random node height if port number is greater than 8000", async () => {
        const result = await action.execute({});

        expect(result).toEqual({ height: 10, randomNodeHeight: 10, randomNodeIp: "0.0.0.0" });
    });

    it("should return only height if no random node with exposed api (no ports defined)", async () => {
        delete mockPeer.ports;

        const result = await action.execute({});

        expect(result).toEqual({ height: 10 });
        expect(result.randomNodeHeight).toBeUndefined();
        expect(result.randomNodeIp).toBeUndefined();
    });

    it("should return only height if no random node with exposed api (port number is negative)", async () => {
        mockPeer.ports["@arkecosystem/core-api"] = -1;

        const result = await action.execute({});

        expect(result).toEqual({ height: 10 });
        expect(result.randomNodeHeight).toBeUndefined();
        expect(result.randomNodeIp).toBeUndefined();
    });
});
