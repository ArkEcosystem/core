import { httpie } from "@arkecosystem/core-utils";
import "jest-extended";
import { setUp, tearDown } from "./__support__/setup";

beforeAll(async () => {
    await setUp();
});

afterAll(async () => {
    await tearDown();
});

describe("Server", () => {
    it("should render the page", async () => {
        const { body, status } = await httpie.get("http://localhost:4006/");

        expect(status).toBe(200);
        expect(body).toContain("Top 51 Delegates Stats");
    });
});
