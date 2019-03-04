import "jest-extended";

import { hasSomeProperty } from "../../../packages/core-utils/src/has-some-property";

beforeEach(() => {
    object = { 'property': null };
});

describe("hasSomeProperty", () => {
    it("should return true if the object has a given property", () => {
        expect(hasSomeProperty(object, ['property'])).toBe(true);
    });

    it("should return true if the object has any of the given properties", () => {
        expect(hasSomeProperty(object, ['not-present', 'property'])).toBe(true);
    });

    it("should return false if the object doesn't have a given property", () => {
        expect(hasSomeProperty(object, ['not-present'])).toBe(false);
    });
});
