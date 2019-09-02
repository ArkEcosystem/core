import "jest-extended";

import { hasSomeProperty } from "@packages/core-kernel/src/utils/has-some-property";

let object;
beforeEach(() => (object = { property: undefined }));

describe("hasSomeProperty", () => {
    it("should return true if the object has a given property", () => {
        expect(hasSomeProperty(object, ["property"])).toBeTrue();
    });

    it("should return true if the object has any of the given properties", () => {
        expect(hasSomeProperty(object, ["not-present", "property"])).toBeTrue();
    });

    it("should return false if the object doesn't have a given property", () => {
        expect(hasSomeProperty(object, ["not-present"])).toBeFalse();
    });
});
