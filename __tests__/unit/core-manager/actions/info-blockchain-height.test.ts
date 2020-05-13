import "jest-extended";

import { Action } from "@packages/core-manager/src/actions/info-blockchain-height";
import { HttpClient } from "@packages/core-manager/src/utils";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let action: Action;

let mockPeers;

beforeEach(() => {
    mockPeers = [
        {
            ip: "0.0.0.0",
            height: 10,
        },
    ];

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
            data: mockPeers,
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
        const result = await action.execute({});

        expect(result).toEqual({ height: 10, randomNodeHeight: 10, randomNodeIp: "0.0.0.0" });
    });

    it("should return only height if no peers found", async () => {
        mockPeers = [];

        const result = await action.execute({});

        expect(result).toEqual({ height: 10 });
        expect(result.randomNodeHeight).toBeUndefined();
        expect(result.randomNodeIp).toBeUndefined();
    });
});
