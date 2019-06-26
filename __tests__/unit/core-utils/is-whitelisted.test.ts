import "jest-extended";

import { isWhitelisted } from "../../../packages/core-utils/src";

describe("isWhitelisted", () => {
    it("should allow everyone", () => {
        expect(isWhitelisted(["*"], "127.0.0.1")).toBeTrue();
        expect(isWhitelisted(["*"], "192.168.1.1")).toBeTrue();
        expect(isWhitelisted(["*"], "168.1.1.1")).toBeTrue();
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
