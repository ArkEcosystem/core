import "jest-extended";

import { InputParser } from "@packages/core-cli/src/input";

describe("InputParser", () => {
    it("should parse the arguments and flags", () => {
        const { args, flags } = InputParser.parseArgv(["env:set", "john", "doe", "--force"]);

        expect(args).toEqual(["env:set", "john", "doe"]);
        expect(flags.force).toBeTrue();
    });
});
