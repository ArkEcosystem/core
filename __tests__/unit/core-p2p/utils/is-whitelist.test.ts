import { isWhitelisted } from "../../../../packages/core-p2p/src/utils";

const whitelist = ["127.0.0.1", "::ffff:127.0.0.1"];

describe("isWhitelist", () => {
    it("should be ok for 127.0.0.1", () => {
        expect(isWhitelisted(whitelist, "127.0.0.1")).toBeTrue();
    });

    it("should be ok for ::ffff:127.0.0.1", () => {
        expect(isWhitelisted(whitelist, "::ffff:127.0.0.1")).toBeTrue();
    });

    it("should not be ok", () => {
        expect(isWhitelisted(whitelist, "dummy")).toBeFalse();
    });
});
