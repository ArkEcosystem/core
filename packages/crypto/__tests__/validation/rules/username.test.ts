import "jest-extended";

import { username } from "../../../src/validation/rules/username";

describe("Username Rule", () => {
    it("should be true", () => {
        expect(username("boldninja").passes).toBeTrue();
    });

    it("should be false", () => {
        expect(username("bold ninja").passes).toBeFalse();
    });
});
