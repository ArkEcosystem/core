import "jest-extended";
import { parseRemoteAddress } from "../../src/utils";

describe("parseRemoteAddress", () => {
    it("should be ok for 127.0.0.1", () => {
        expect(parseRemoteAddress({ ip: "127.0.0.1" })).toBeTrue();
    });

    it("should be ok for ::ffff:127.0.0.1", () => {
        const peer = { ip: "::ffff:127.0.0.1" };
        expect(parseRemoteAddress(peer)).toBeTrue();
        expect(peer.ip).toBe("::ffff:7f00:1");
    });

    it("should be normalize non-quad-dotted addresses", () => {
        const peer = { ip: "2130706433" };
        expect(parseRemoteAddress(peer)).toBeTrue();
        expect(peer.ip).toBe("127.0.0.1");
    });

    it("should not be ok for garbage", () => {
        expect(parseRemoteAddress({ ip: "garbage" })).toBeFalse();
    });
});
