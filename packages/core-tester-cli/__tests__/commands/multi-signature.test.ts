import "jest-extended";
import { MultiSignature } from "../../src/commands/multi-signature";

describe("Commands - Multi-signature", () => {
    it("should be a function", () => {
        expect(MultiSignature).toBeFunction();
    });
});
