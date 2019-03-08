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
        const response = await axios.get("http://localhost:4006/");

        expect(response.status).toBe(200);
        expect(response.data).toContain("Top 51 Delegates Stats");
    });
});
