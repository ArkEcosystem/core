import "jest-extended";

import { isWhitelisted } from "@packages/core-kernel/src/utils/is-whitelisted";

describe("isWhitelisted", () => {
    it("should allow everyone if there is whitelist", () => {
        expect(isWhitelisted(null, "127.0.0.1")).toBeTrue();
        expect(isWhitelisted(null, "::1")).toBeTrue();

        expect(isWhitelisted(undefined, "192.168.1.1")).toBeTrue();
        expect(isWhitelisted(undefined, "::1")).toBeTrue();

        expect(isWhitelisted([], "168.1.1.1")).toBeTrue();
        expect(isWhitelisted([], "::1")).toBeTrue();
        expect(isWhitelisted([], "2001:3984:3989::104")).toBeTrue();
    });

    it("should allow everyone", () => {
        expect(isWhitelisted(["*"], "127.0.0.1")).toBeTrue();
        expect(isWhitelisted(["*"], "192.168.1.1")).toBeTrue();
        expect(isWhitelisted(["*"], "168.1.1.1")).toBeTrue();

        expect(isWhitelisted(["*"], "::1")).toBeTrue();
        expect(isWhitelisted(["*"], "2001:3984:3989::104")).toBeTrue();
    });

    it("should allow addresses with prefixes", () => {
        expect(isWhitelisted(["127.*"], "127.0.0.1")).toBeTrue();
        expect(isWhitelisted(["127.*"], "127.0.0.2")).toBeTrue();
        expect(isWhitelisted(["127.*"], "128.0.0.1")).toBeFalse();
    });

    it("should allow addresses with suffixes", () => {
        expect(isWhitelisted(["*.127"], "1.1.1.127")).toBeTrue();
        expect(isWhitelisted(["*.127"], "1.1.1.127")).toBeTrue();
        expect(isWhitelisted(["*.127"], "1.1.1.128")).toBeFalse();
    });
});
