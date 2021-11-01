import "jest-extended";

import {
    cleanAddress,
    isIPv6Address,
    isValidAddress,
    normalizeAddress,
} from "@packages/core-kernel/src/utils/ip-address";

describe("isValidAddress", () => {
    it("should return true for valid IPv6 address", () => {
        expect(isValidAddress("2001:3984:3989::104")).toBeTrue();
    });

    it("should return true for localhost IPv6 address", () => {
        expect(isValidAddress("::1")).toBeTrue();
    });

    it("should return true for :: IPv6 address", () => {
        expect(isValidAddress("::")).toBeTrue();
    });

    it("should return true for valid IPv6 address in brackets", () => {
        expect(isValidAddress("[2001:3984:3989::104]")).toBeTrue();
    });

    it("should return false for invalid IPv6 address", () => {
        expect(isValidAddress("2001:3984:3989:104:1:2001:3984:3989:10")).toBeFalse(); // Too long address
    });

    it("should return true for valid IPv4 address", () => {
        expect(isValidAddress("127.0.0.1")).toBeTrue();
    });

    it("should return true for invalid IPv4 address", () => {
        expect(isValidAddress("127.0.0.300")).toBeFalse();
    });

    it("should return false for random string", () => {
        expect(isValidAddress("random")).toBeFalse();
    });
});

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

    it("should return true for valid IPv6 address in brackets", () => {
        expect(isIPv6Address("[2001:3984:3989::104]")).toBeTrue();
    });

    it("should return false for invalid IPv6 address", () => {
        expect(isIPv6Address("2001:3984:3989:104:1:2001:3984:3989:10")).toBeFalse(); // Too long address
    });

    it("should return false for valid IPv4 address", () => {
        expect(isIPv6Address("127.0.0.1")).toBeFalse();
    });

    it("should return false for random string", () => {
        expect(isIPv6Address("random")).toBeFalse();
    });
});

describe("normalizeAddress", () => {
    it("should return normalized IPv6 address", () => {
        expect(normalizeAddress("2001:3984:3989::104")).toEqual("[2001:3984:3989::104]");
    });

    it("should return normalized localhost IPv6 address", () => {
        expect(normalizeAddress("::1")).toEqual("[::1]");
    });

    it("should return normalized :: IPv6 address", () => {
        expect(normalizeAddress("::")).toEqual("[::]");
    });

    it("should keep normalized IPv6 address in brackets", () => {
        expect(normalizeAddress("[2001:3984:3989::104]")).toEqual("[2001:3984:3989::104]");
    });

    it("should return same IPv4 address", () => {
        expect(normalizeAddress("127.0.0.1")).toEqual("127.0.0.1");
    });

    it("should return same random string", () => {
        expect(normalizeAddress("random")).toEqual("random");
    });
});

describe("cleanAddress", () => {
    it("should return clean IPv6 address", () => {
        expect(cleanAddress("2001:3984:3989::104")).toEqual("2001:3984:3989::104");
    });

    it("should return clean localhost IPv6 address", () => {
        expect(cleanAddress("::1")).toEqual("::1");
    });

    it("should return clean :: IPv6 address", () => {
        expect(cleanAddress("::")).toEqual("::");
    });

    it("should keep clean IPv6 address in brackets", () => {
        expect(cleanAddress("[2001:3984:3989::104]")).toEqual("2001:3984:3989::104");
    });

    it("should return same IPv4 address", () => {
        expect(cleanAddress("127.0.0.1")).toEqual("127.0.0.1");
    });

    it("should return same random string", () => {
        expect(cleanAddress("random")).toEqual("random");
    });
});
