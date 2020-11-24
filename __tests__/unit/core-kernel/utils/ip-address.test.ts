import "jest-extended";

import { isIPv6Address } from "@packages/core-kernel/src/utils/ip-address";

describe("isIPv6Address", () => {
    it("should return true for valid IPv6 address", () => {
        expect(isIPv6Address("2001:3984:3989::104")).toBeTrue();
    });

    it("should return true for localhost IPv6 address", () => {
        expect(isIPv6Address("::1")).toBeTrue();
    });

    it("should return true for :: IPv6 address", () => {
        expect(isIPv6Address("::")).toBeTrue();
    });

    it("should return false for valid IPv4 address", () => {
        expect(isIPv6Address("127.0.0.1")).toBeFalse();
    });

    it("should return false for random string", () => {
        expect(isIPv6Address("random")).toBeFalse();
    });
});
