import "jest-extended";

import Joi from "@hapi/joi";

import { InputDefinition } from "@packages/core-cli/src/input";

describe("InputDefinition", () => {
    it("should get all arguments", () => {
        const definition = new InputDefinition();
        definition.setArgument("firstName", "...", Joi.string());
        definition.setArgument("lastName", "...", Joi.string());

        expect(definition.getArguments()).toEqual({
            firstName: { description: "...", schema: Joi.string() },
            lastName: { description: "...", schema: Joi.string() },
        });
    });

    it("should get the value of an argument by name", () => {
        const definition = new InputDefinition();
        definition.setArgument("firstName", "...", Joi.string());

        expect(definition.getArgument("firstName")).toEqual({ description: "...", schema: Joi.string() });
    });

    it("should set the value of an argument by name", () => {
        const definition = new InputDefinition();
        definition.setArgument("firstName", "...", Joi.string());

        expect(definition.getArgument("firstName")).toEqual({ description: "...", schema: Joi.string() });

        definition.setArgument("firstName", "...", Joi.number());

        expect(definition.getArgument("firstName")).toEqual({ description: "...", schema: Joi.number() });
    });

    it("should check if an argument exists", () => {
        const definition = new InputDefinition();

        expect(definition.hasArgument("middleName")).toBeFalse();

        definition.setArgument("middleName", "...", Joi.number());

        expect(definition.hasArgument("middleName")).toBeTrue();
    });

    it("should get all flags", () => {
        const definition = new InputDefinition();
        definition.setFlag("firstName", "...", Joi.string());
        definition.setFlag("lastName", "...", Joi.string());

        expect(definition.getFlags()).toEqual({
            firstName: { description: "...", schema: Joi.string() },
            lastName: { description: "...", schema: Joi.string() },
        });
    });

    it("should get the value of a flag by name", () => {
        const definition = new InputDefinition();
        definition.setFlag("firstName", "...", Joi.string());

        expect(definition.getFlag("firstName")).toEqual({ description: "...", schema: Joi.string() });
    });

    it("should set the value of a flag by name", () => {
        const definition = new InputDefinition();
        definition.setFlag("firstName", "...", Joi.string());

        expect(definition.getFlag("firstName")).toEqual({ description: "...", schema: Joi.string() });

        definition.setFlag("firstName", "...", Joi.number());

        expect(definition.getFlag("firstName")).toEqual({ description: "...", schema: Joi.number() });
    });

    it("should check if a flag exists", () => {
        const definition = new InputDefinition();

        expect(definition.hasFlag("middleName")).toBeFalse();

        definition.setFlag("middleName", "...", Joi.number());

        expect(definition.hasFlag("middleName")).toBeTrue();
    });
});
