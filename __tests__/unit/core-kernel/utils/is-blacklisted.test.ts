import "jest-extended";

import { isBlacklisted } from "@packages/core-kernel/src/utils/is-blacklisted";

describe("isBlacklisted", () => {
    it("should allow everyone if there is no blacklist", () => {
        expect(isBlacklisted(null, "127.0.0.1")).toBeFalse();
        expect(isBlacklisted(undefined, "192.168.1.1")).toBeFalse();
        expect(isBlacklisted([], "168.1.1.1")).toBeFalse();
    });

    it("should block everyone", () => {
        expect(isBlacklisted(["*"], "127.0.0.1")).toBeTrue();
        expect(isBlacklisted(["*"], "192.168.1.1")).toBeTrue();
        expect(isBlacklisted(["*"], "168.1.1.1")).toBeTrue();
    });

    it("should block addresses with prefixes", () => {
        expect(isBlacklisted(["127.*"], "127.0.0.1")).toBeTrue();
        expect(isBlacklisted(["127.*"], "127.0.0.2")).toBeTrue();
        expect(isBlacklisted(["127.*"], "128.0.0.1")).toBeFalse();
    });

    it("should block addresses with suffixes", () => {
        expect(isBlacklisted(["*.127"], "1.1.1.127")).toBeTrue();
        expect(isBlacklisted(["*.127"], "1.1.1.127")).toBeTrue();
        expect(isBlacklisted(["*.127"], "1.1.1.128")).toBeFalse();
    });
});
