import { InvalidArgumentException } from "@packages/core-kernel/src/exceptions/logic";
import { Triggers, Action } from "@packages/core-kernel/src/services/triggers";

let triggers: Triggers;
beforeEach(() => (triggers = new Triggers()));

test("binds a trigger with a <before> hook and executes them", async () => {
    let fnValue = 0;

    triggers.bind("count", () => fnValue++).before(() => fnValue++);

    await triggers.call("count");

    expect(fnValue).toBe(2);
});

test("binds a trigger with an <error> hook and executes them", async () => {
    let fnValue = 0;

    triggers
        .bind("count", () => {
            fnValue++;

            throw new Error("Hello World");
        })
        .error(() => fnValue++);

    await triggers.call("count");

    expect(fnValue).toBe(2);
});

test("binds a trigger with an <after> hook and executes them", async () => {
    let fnValue = 0;

    triggers.bind("count", () => fnValue++).after(() => fnValue++);

    await triggers.call("count");

    expect(fnValue).toBe(2);
});

test("binds a trigger with <before/error/after> hooks and executes them", async () => {
    let fnValue = 0;

    triggers
        .bind("count", () => {
            fnValue++;

            throw new Error("Hello World");
        })
        .before(() => fnValue++)
        .error(() => fnValue++)
        .after(() => fnValue++);

    await triggers.call("count");

    expect(fnValue).toBe(4);
});

test("throws an error if a trigger is not registered", async () => {
    expect(triggers.call("count")).rejects.toThrowError(
        new InvalidArgumentException("The given trigger [count] is not available."),
    );
});

test("throws an error if a trigger is already registered", async () => {
    triggers.bind("duplicate", Function);

    expect(() => {
        triggers.bind("duplicate", Function);
    }).toThrowError(new InvalidArgumentException("The given trigger [duplicate] is already registered."));
});

test("throws an error if a trigger is reserved", async () => {
    expect(() => {
        triggers.bind("internal.trigger", Function);
    }).toThrowError(new InvalidArgumentException("The given trigger [internal.trigger] is reserved."));
});

describe("get", () => {
    test("returns a trigger for the given trigger", async () => {
        const fn = () => {};

        triggers.bind("count", fn);

        expect(triggers.get("count")).toEqual(new Action(fn));
    });

    test("throws an error if a trigger is not registered", async () => {
        expect(() => triggers.get("count")).toThrowError(
            new InvalidArgumentException("The given trigger [count] is not available."),
        );
    });
});
