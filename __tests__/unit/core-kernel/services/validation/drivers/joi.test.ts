import "jest-extended";

import Joi from "joi";
import { JoiValidator } from "@packages/core-kernel/src/services/validation/drivers/joi";

const schema = Joi.object({
    username: Joi.string().alphanum().required(),
});

let validator: JoiValidator;
beforeEach(() => (validator = new JoiValidator()));

describe("JoiValidator", () => {
    it("should pass to validate the given data", () => {
        validator.validate({ username: "johndoe" }, schema);

        expect(validator.passes()).toBeTrue();
        expect(validator.invalid()).toStrictEqual({});
        expect(validator.failed()).toStrictEqual({});
        expect(validator.errors()).toStrictEqual({});
    });

    it("should fail to validate the given data", () => {
        validator.validate({ username: "l337_p@nda" }, schema);

        expect(validator.fails()).toBeTrue();
    });

    it("should return the failed rules", () => {
        validator.validate({ username: "l337_p@nda" }, schema);

        expect(validator.failed()).toEqual({ username: ["string.alphanum"] });
    });

    it("should return the error messages", () => {
        validator.validate({ username: "l337_p@nda" }, schema);

        expect(validator.errors()).toEqual({ username: ['"username" must only contain alpha-numeric characters'] });
    });

    it("should return the valid attributes", () => {
        validator.validate({ username: "johndoe" }, schema);

        expect(validator.valid()).toEqual({ username: "johndoe" });
    });

    it("should return the invalid attributes", () => {
        validator.validate({ username: "l337_p@nda" }, schema);

        expect(validator.invalid()).toEqual({ username: "l337_p@nda" });
    });

    it("should return the original attributes", () => {
        validator.validate({ username: "l337_p@nda" }, schema);

        expect(validator.attributes()).toEqual({ username: "l337_p@nda" });
    });
});
