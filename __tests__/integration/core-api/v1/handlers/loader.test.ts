import "../../../../utils";
import { setUp, tearDown } from "../../__support__/setup";
import { utils } from "../utils";

beforeAll(async () => {
    await setUp();
});

afterAll(async () => {
    await tearDown();
});

describe("API 1.0 - Loader", () => {
    describe("GET /loader/status", () => {
        it("should be ok", async () => {
            const response = await utils.request("GET", "loader/status");
            expect(response).toBeSuccessfulResponse();

            expect(response.data).toBeObject();
            expect(response.data).toHaveProperty("loaded");
            expect(response.data).toHaveProperty("now");
            expect(response.data).toHaveProperty("blocksCount");
        });
    });

    describe("GET /loader/status/sync", () => {
        it("should be ok", async () => {
            const response = await utils.request("GET", "loader/status/sync");
            expect(response).toBeSuccessfulResponse();

            expect(response.data).toBeObject();
            expect(response.data).toHaveProperty("syncing");
            expect(response.data).toHaveProperty("blocks");
            expect(response.data).toHaveProperty("height");
            expect(response.data).toHaveProperty("id");
        });
    });

    describe("GET /loader/autoconfigure", () => {
        it("should be ok", async () => {
            const response = await utils.request("GET", "loader/autoconfigure");
            expect(response).toBeSuccessfulResponse();

            expect(response.data).toBeObject();
            expect(response.data.network).toBeObject();
            expect(response.data.network).toHaveProperty("nethash");
            expect(response.data.network).toHaveProperty("token");
            expect(response.data.network).toHaveProperty("symbol");
            expect(response.data.network).toHaveProperty("explorer");
            expect(response.data.network).toHaveProperty("version");
        });
    });
});
