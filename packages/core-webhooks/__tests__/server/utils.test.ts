import "jest-extended";

import { Enums } from "@arkecosystem/core-kernel";
import { Webhook } from "@arkecosystem/core-webhooks/src/interfaces";
import { respondWithResource } from "@packages/core-webhooks/src/server/utils";

const data: Webhook = {
    id: "dummy_id",
    token: "ark",
    event: Enums.BlockEvent.Forged,
    target: "https://httpbin.org/post",
    enabled: true,
    conditions: [
        {
            key: "generatorPublicKey",
            condition: "eq",
            value: "test-generator",
        },
        {
            key: "fee",
            condition: "gte",
            value: "123",
        },
    ],
};

describe("Utils", () => {
    it("respondWithResource should return transformed resource", async () => {
        expect(respondWithResource(data)).toEqual({ data: data });
    });

    it("respondWithResource should return not found", async () => {
        expect(respondWithResource(undefined)).toEqual(new Error("Not Found"));
    });
});
