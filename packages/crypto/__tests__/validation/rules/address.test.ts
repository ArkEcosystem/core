import "jest-extended";

import { address } from "../../../src/validation/rules/address";

describe("Address Rule", () => {
    it("should be true", () => {
        expect(address("DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN").passes).toBeTrue();
    });

    it("should be false", () => {
        expect(address("_DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN_").passes).toBeFalse();
    });
});
