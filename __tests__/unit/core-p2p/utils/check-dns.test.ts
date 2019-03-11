import { checkDNS } from "../../../../packages/core-p2p/src/utils";

describe("Check DNS", () => {
    it("should be ok", async () => {
        const response = await checkDNS(["1.1.1.1"]);
        expect(response).toBe("1.1.1.1");
    });
});
