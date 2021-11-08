import "jest-extended";

import { Console } from "@packages/core-test-framework";
import Joi from "joi";
import { InputValidator } from "@packages/core-cli/src/input";

let cli;
let validator;
beforeEach(() => {
    cli = new Console();
    validator = cli.app.resolve(InputValidator);
});

describe("InputValidator", () => {
    it("should validate the data and return it", () => {
        expect(
            validator.validate(
                { firstName: "john", lastName: "doe" },
                {
                    firstName: Joi.string(),
                    lastName: Joi.string(),
                },
            ),
        ).toEqual({ firstName: "john", lastName: "doe" });
    });

    it("should throw if the data is valid", () => {
        expect(() =>
            validator.validate(
                { firstName: "john", lastName: "doe" },
                {
                    firstName: Joi.string(),
                    lastName: Joi.number(),
                },
            ),
        ).toThrow('"lastName" must be a number');
    });
});
