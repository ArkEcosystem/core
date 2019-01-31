import "jest-extended";
import { isValidPeer } from "../../src/utils";

describe("isValidPeer", () => {
    it("should not be ok for 127.0.0.1", () => {
        expect(isValidPeer({ ip: "127.0.0.1" })).toBeFalse();
    });

    it("should not be ok for ::ffff:127.0.0.1", () => {
        const peer = { ip: "::ffff:127.0.0.1" };
        expect(isValidPeer(peer)).toBeFalse();
    });

    it("should not be ok for ::1", () => {
        const peer = { ip: "::1" };
        expect(isValidPeer(peer)).toBeFalse();
    });

    it("should not be ok for 2130706433", () => {
        const peer = { ip: "2130706433" };
        expect(isValidPeer(peer)).toBeFalse();
    });

    it("should not be ok for garbage", () => {
        expect(isValidPeer({ ip: "garbage" })).toBeFalse();
    });

    it("should not be ok for invalid status", () => {
        expect(isValidPeer({ ip: "5.196.105.32", status: 400 })).toBeFalse();
    });

    it("should be ok", () => {
        expect(isValidPeer({ ip: "5.196.105.32" })).toBeTrue();
        expect(isValidPeer({ ip: "5.196.105.32", status: 200 })).toBeTrue();
        expect(isValidPeer({ ip: "5.196.105.32", status: "OK" })).toBeTrue();
    });
});
