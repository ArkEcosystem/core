import "jest-extended";

import { FactoryBuilder } from "@packages/core-test-framework/src/factories/factory-builder";

let factory: FactoryBuilder;

beforeEach(() => (factory = new FactoryBuilder()));

describe("FactoryBuilder", () => {
    it("should create a new entity", () => {
        factory.set("Transaction", () => ({
            valid: true,
        }));

        expect(factory.get("Transaction").make()).toEqual({ valid: true });
    });

    it("should create a new entity and apply the mutators", () => {
        factory.set("Transaction", () => ({
            valid: true,
        }));

        factory.get("Transaction").state("verified", ({ entity }) => {
            entity.verified = true;

            return entity;
        });

        factory.get("Transaction").state("expired", ({ entity }) => {
            entity.expired = true;

            return entity;
        });

        expect(factory.get("Transaction").withStates("verified", "expired").make()).toEqual({
            valid: true,
            verified: true,
            expired: true,
        });
    });

    it("should create a new entity and merge the given attributes", () => {
        factory.set("Transaction", () => ({
            valid: true,
        }));

        expect(factory.get("Transaction").withAttributes({ another: "value" }).make()).toEqual({
            valid: true,
            another: "value",
        });
    });

    it("should create a new entity and add attributes through a hook", () => {
        factory.set("Transaction", () => ({
            valid: true,
        }));

        factory.get("Transaction").afterMaking(({ entity }) => (entity.hooked = true));

        expect(factory.get("Transaction").make()).toEqual({
            valid: true,
            hooked: true,
        });
    });

    it("should create a new entity and add attributes through a state hook", () => {
        factory.set("Transaction", () => ({
            valid: true,
        }));

        factory.get("Transaction").state("invalid", () => ({
            valid: false,
        }));

        factory.get("Transaction").afterMakingState("invalid", ({ entity }) => (entity.hooked = false));

        expect(factory.get("Transaction").withStates("invalid").make()).toEqual({
            valid: false,
            hooked: false,
        });

        factory.get("Transaction").afterMakingState("invalid", ({ entity }) => (entity.hooked = true));

        expect(factory.get("Transaction").withStates("invalid").make()).toEqual({
            valid: false,
            hooked: true,
        });
    });

    it("should create a new entity and respect the passed in options", () => {
        factory.set("Transaction", ({ options }) => ({
            valid: options.valid,
        }));

        expect(factory.get("Transaction").withOptions({ valid: "no" }).make()).toEqual({
            valid: "no",
        });
    });

    it("should create multiple entities", () => {
        factory.set("Transaction", () => ({
            valid: true,
        }));

        expect(factory.get("Transaction").makeMany(5)).toEqual(new Array(5).fill({ valid: true }));
    });

    it("should throw if an unknown factory is tried to be accessed", () => {
        expect(() => factory.get("Transaction")).toThrow("The [Transaction] factory is unknown.");
    });

    it("should throw if a hook is tried to be set for an unknown state", () => {
        factory.set("Transaction", () => ({}));

        expect(() => factory.get("Transaction").afterMakingState("invalid", () => ({}))).toThrow(
            "The [invalid] state is unknown.",
        );
    });
});
