import { checkDNS } from "@arkecosystem/core-p2p/src/utils/check-dns";

const app = {
    log: { error: jest.fn() },
} as any;

describe("Check DNS", () => {
    it("should be ok", async () => {
        const response = await checkDNS(app, ["1.1.1.1"]);
        expect(response).toBe("1.1.1.1");
    });
});
