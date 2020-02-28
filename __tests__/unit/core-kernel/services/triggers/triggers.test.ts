import { InvalidArgumentException } from "@packages/core-kernel/src/exceptions/logic";
import { Triggers, Action } from "@packages/core-kernel/src/services/triggers";
import { ActionArguments } from "@packages/core-kernel/src/types";

class DummyAction extends Action {
    public execute<T>(args: ActionArguments): T {
        return args.returnValue || true;
    }
}

class DummyActionWithException extends Action {
    public execute<T>(): T {
        throw new Error("Hello World");
    }
}

let triggers: Triggers;

beforeEach(() => (triggers = new Triggers()));

test("binds a trigger and accepts arguments for calls", async () => {
    let before: jest.Mock = jest.fn();

    triggers.bind("count", new DummyAction()).before(before);

    await expect(
        triggers.call<boolean>("count", {
            returnValue: "Hello World",
        }),
    ).resolves.toBe("Hello World");
    expect(before).toHaveBeenCalled();
});

test("binds a trigger with a <before> hook and executes them", async () => {
    let before: jest.Mock = jest.fn();

    triggers.bind("count", new DummyAction()).before(before);

    await expect(triggers.call<boolean>("count")).resolves.toBe(true);
    expect(before).toHaveBeenCalled();
});

test("binds a trigger with an <error> hook and executes them", async () => {
    let error: jest.Mock = jest.fn();

    triggers.bind("count", new DummyActionWithException()).error(error);

    await expect(triggers.call<boolean>("count")).resolves.toBeUndefined();
    expect(error).toHaveBeenCalled();
});

test("binds a trigger with an <after> hook and executes them", async () => {
    let after: jest.Mock = jest.fn();

    triggers.bind("count", new DummyAction()).after(after);

    await expect(triggers.call<boolean>("count")).resolves.toBe(true);
    expect(after).toHaveBeenCalled();
});

test("binds a trigger with <before/error/after> hooks and executes them", async () => {
    let before: jest.Mock = jest.fn();
    let error: jest.Mock = jest.fn();
    let after: jest.Mock = jest.fn();

    triggers
        .bind("count", new DummyActionWithException())
        .before(before)
        .error(error)
        .after(after);

    await expect(triggers.call<boolean>("count")).resolves.toBeUndefined();
    expect(before).toHaveBeenCalled();
    expect(error).toHaveBeenCalled();
    expect(after).toHaveBeenCalled();
});

test("throws an error if a trigger is not registered", async () => {
    expect(triggers.call("count")).rejects.toThrowError(
        new InvalidArgumentException("The given trigger [count] is not available."),
    );
});

test("throws an error if a trigger is already registered", async () => {
    triggers.bind("duplicate", new DummyAction());

    expect(() => {
        triggers.bind("duplicate", new DummyAction());
    }).toThrowError(new InvalidArgumentException("The given trigger [duplicate] is already registered."));
});

test("throws an error if a trigger is reserved", async () => {
    expect(() => {
        triggers.bind("internal.trigger", new DummyAction());
    }).toThrowError(new InvalidArgumentException("The given trigger [internal.trigger] is reserved."));
});

describe("get", () => {
    test("returns a trigger for the given trigger", async () => {
        triggers.bind("count", new DummyAction());

        expect(triggers.get("count")).toBeInstanceOf(Action);
    });

    test("throws an error if a trigger is not registered", async () => {
        expect(() => triggers.get("count")).toThrowError(
            new InvalidArgumentException("The given trigger [count] is not available."),
        );
    });
});
