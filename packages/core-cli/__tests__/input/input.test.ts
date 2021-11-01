import "jest-extended";

import { Console } from "@arkecosystem/core-test-framework";
import Joi from "joi";
import { Input, InputDefinition } from "@packages/core-cli/src/input";

let cli;
beforeEach(() => (cli = new Console()));

const createInput = (args?: string[]): Input => {
    const definition = new InputDefinition();
    definition.setArgument("firstName", "description", Joi.string());
    definition.setArgument("lastName", "description", Joi.string());
    definition.setFlag("hello", "description", Joi.string());
    definition.setFlag("firstName", "description", Joi.string());
    definition.setFlag("lastName", "description", Joi.string());

    const input = cli.app.resolve(Input);
    input.parse(args || ["env:paths", "john", "doe", "--hello=world"], definition);
    input.bind();
    input.validate();

    return input;
};

describe("Input", () => {
    it("should parse, bind and validate the arguments and flags", () => {
        const input = createInput();

        expect(input.getArgument("firstName")).toBe("john");
        expect(input.getArgument("lastName")).toBe("doe");
        expect(input.getFlag("hello")).toBe("world");
    });

    it("should parse, bind and validate the arguments", () => {
        const definition = new InputDefinition();
        definition.setArgument("firstName", "description", Joi.string());
        definition.setArgument("lastName", "description", Joi.string());

        const input = cli.app.resolve(Input);
        input.parse(["env:paths", "john", "doe"], definition);
        input.bind();
        input.validate();

        expect(input.getArgument("firstName")).toBe("john");
        expect(input.getArgument("lastName")).toBe("doe");
    });

    it("should parse, bind and validate the flags", () => {
        const definition = new InputDefinition();
        definition.setFlag("hello", "description", Joi.string());

        const input = cli.app.resolve(Input);
        input.parse(["env:paths", "--hello=world"], definition);
        input.bind();
        input.validate();

        expect(input.getFlag("hello")).toBe("world");
    });

    it("should parse, bind and validate nothing", () => {
        const input = cli.app.resolve(Input);
        input.parse(["env:paths"], new InputDefinition());
        input.bind();
        input.validate();

        expect(input.getArguments()).toBeEmpty();
    });

    it("should get all arguments", () => {
        const input = createInput();

        expect(input.getArguments()).toEqual({
            firstName: "john",
            lastName: "doe",
        });
    });

    it("should get all arguments merged with the given values", () => {
        const input = createInput();

        expect(input.getArguments({ middleName: "jane" })).toEqual({
            firstName: "john",
            lastName: "doe",
            middleName: "jane",
        });
    });

    it("should get an argument by name", () => {
        const input = createInput();

        expect(input.getArgument("firstName")).toBe("john");
    });

    it("should set the value of an argument by name", () => {
        const input = createInput();

        expect(input.getArgument("firstName")).toBe("john");

        input.setArgument("firstName", "jane");

        expect(input.getArgument("firstName")).toBe("jane");
    });

    it("should check if an argument exists", () => {
        const input = createInput();

        expect(input.hasArgument("middleName")).toBeFalse();

        input.setArgument("middleName", "jane");

        expect(input.hasArgument("middleName")).toBeTrue();
    });

    it("should get all flags", () => {
        const input = createInput(["env:paths", "--firstName=john", "--lastName=doe"]);

        expect(input.getFlags()).toEqual({
            firstName: "john",
            lastName: "doe",
            v: 0,
        });
    });

    it("should get all flags merged with the given values", () => {
        const input = createInput(["env:paths", "--firstName=john", "--lastName=doe"]);

        expect(input.getFlags({ middleName: "jane" })).toEqual({
            firstName: "john",
            lastName: "doe",
            middleName: "jane",
            v: 0,
        });
    });

    it("should get a flag by name", () => {
        const input = createInput(["env:paths", "--firstName=john", "--lastName=doe"]);

        expect(input.getFlag("firstName")).toBe("john");
    });

    it("should set the value of a flag by name", () => {
        const input = createInput(["env:paths", "--firstName=john", "--lastName=doe"]);

        expect(input.getFlag("firstName")).toBe("john");

        input.setFlag("firstName", "jane");

        expect(input.getFlag("firstName")).toBe("jane");
    });

    it("should check if a flag exists", () => {
        const input = createInput(["env:paths", "--firstName=john", "--lastName=doe"]);

        expect(input.hasFlag("middleName")).toBeFalse();

        input.setFlag("middleName", "jane");

        expect(input.hasFlag("middleName")).toBeTrue();
    });
});
