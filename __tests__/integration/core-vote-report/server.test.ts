import got from "got";
import { setUp, tearDown } from "./__support__/setup";

beforeAll(async () => await setUp());
afterAll(async () => await tearDown());

describe("Server", () => {
    it("should render the page", async () => {
        const { body, statusCode } = await got.get("http://localhost:4006/");

        expect(statusCode).toBe(200);
        expect(body).toContain("Top 51 Delegates Stats");
    });
});
