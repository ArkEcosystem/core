import "../../mocks/core-container";

import { Crypto } from "@arkecosystem/crypto";
import { replySchemas } from "../../../../../packages/core-p2p/src/schemas";
import { validate } from "../../../../../packages/core-p2p/src/socket-server/utils/validate";
import { getStatus } from "../../../../../packages/core-p2p/src/socket-server/versions/peer";

describe("Peer reply validation", () => {
    describe("getStatus", () => {
        beforeAll(() => {
            Crypto.Slots.isForgingAllowed = jest.fn().mockReturnValue(true);
            Crypto.Slots.getSlotNumber = jest.fn().mockReturnValue(3);
        });

        it("should be valid", async () => {
            const schema = replySchemas["p2p.peer.getStatus"];
            const result = await getStatus();

            expect(() => validate(schema, result)).not.toThrowError();

            (result.state as any).header = {};
            expect(() => validate(schema, result)).not.toThrowError();

            (result.state as any).header = { id: 1 };
            expect(() => validate(schema, result)).toThrowError();
        });

        it("should strip invalid properties", async () => {
            const schema = replySchemas["p2p.peer.getStatus"];
            const result = await getStatus();

            (result.config as any).plugins = {
                "@arkecosystem/core-api": {
                    enabled: true,
                    port: 4003,
                    x: 1,
                },
                "@arkecosystem/core-exchange-json-rpc": {
                    enabled: false,
                    port: 8080,
                },
                "@arkecosystem/core-webhooks": {
                    enabled: false,
                    port: 4004,
                },
            };

            expect(() => validate(schema, result)).not.toThrowError();
            expect(result.config.plugins["@arkecosystem/core-api"]).not.toHaveProperty("x");

            result.config.plugins = {
                aa: {
                    enabled: true,
                    port: 4002,
                },
                "@arkecosystem/core-api-core-exchange-json-rpc-core-exchange-json-rpc": {
                    enabled: true,
                    port: 4003,
                },
                "@arkecosystem/core-exchange-json-rpc": {
                    enabled: false,
                    port: 8080,
                },
                "@arkecosystem/core-webhooks": {
                    enabled: false,
                    port: 4004,
                },
            };

            expect(() => validate(schema, result)).not.toThrowError();
            expect(result).not.toHaveProperty("aa");
            expect(result).not.toHaveProperty("@arkecosystem/core-api-core-exchange-json-rpc-core-exchange-json-rpc");
        });

        it("should fail with too many properties", async () => {
            const schema = replySchemas["p2p.peer.getStatus"];
            const result = await getStatus();

            result.config.plugins = {};
            for (let i = 0; i < 32; i++) {
                result.config.plugins[`@arkecosystem/core-api-${i}`] = {
                    enabled: true,
                    port: 4003,
                };
            }

            expect(() => validate(schema, result)).not.toThrowError();

            result.config.plugins["too-many"] = { enabled: true, port: 1234 };

            expect(() => validate(schema, result)).toThrowError();
        });
    });
});
