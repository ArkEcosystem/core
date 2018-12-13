import { setUp, tearDown } from "../__support__/setup";

let checker;

beforeAll(async () => {
    await setUp();
});

afterAll(async () => {
    await tearDown();
});

beforeEach(() => {
    checker = require("../../src/utils/check-dns");
});

describe("Check DNS", () => {
    it("should be ok", async () => {
        const response = await checker(["1.1.1.1"]);

        expect(response).toBe("1.1.1.1");
    });
});
