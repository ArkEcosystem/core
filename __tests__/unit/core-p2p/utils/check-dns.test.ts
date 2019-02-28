import { checkDNS } from "../../../../packages/core-p2p/src/utils";
import { setUp, tearDown } from "../__support__/setup";

beforeAll(async () => {
    await setUp();
});

afterAll(async () => {
    await tearDown();
});

describe("Check DNS", () => {
    it("should be ok", async () => {
        const response = await checkDNS(["1.1.1.1"]);
        expect(response).toBe("1.1.1.1");
    });
});
