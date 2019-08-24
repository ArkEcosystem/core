import { Actions } from "../../../../../packages/core-kernel/src/services/actions/actions";
import { InvalidArgumentException } from "../../../../../packages/core-kernel/src/exceptions/logic";
import { Action } from "../../../../../packages/core-kernel/src/services/actions/action";

let actions: Actions;
beforeEach(() => {
    actions = new Actions();
});

test("binds an action with a <before> hook and executes them", async () => {
    let fnValue = 0;

    actions.bind("count", () => fnValue++).before(() => fnValue++);

    await actions.call("count");

    expect(fnValue).toBe(2);
});

test("binds an action with a <error> hook and executes them", async () => {
    let fnValue = 0;

    actions
        .bind("count", () => {
            fnValue++;

            throw new Error("Hello World");
        })
        .error(() => fnValue++);

    await actions.call("count");

    expect(fnValue).toBe(2);
});

test("binds an action with a <after> hook and executes them", async () => {
    let fnValue = 0;

    actions.bind("count", () => fnValue++).after(() => fnValue++);

    await actions.call("count");

    expect(fnValue).toBe(2);
});

test("binds an action with <before/error/after> hooks and executes them", async () => {
    let fnValue = 0;

    actions
        .bind("count", () => {
            fnValue++;

            throw new Error("Hello World");
        })
        .before(() => fnValue++)
        .error(() => fnValue++)
        .after(() => fnValue++);

    await actions.call("count");

    expect(fnValue).toBe(4);
});

test("throws an error if an action is not registered", async () => {
    expect(actions.call("count")).rejects.toThrowError(
        new InvalidArgumentException("The given action [count] is not available."),
    );
});

test("throws an error if an action is already registered", async () => {
    actions.bind("duplicate", Function);

    expect(() => {
        actions.bind("duplicate", Function);
    }).toThrowError(new InvalidArgumentException("The given action [duplicate] is already registered."));
});

test("throws an error if an action is reserved", async () => {
    expect(() => {
        actions.bind("internal.action", Function);
    }).toThrowError(new InvalidArgumentException("The given action [internal.action] is reserved."));
});

describe("get", () => {
    test("returns an action for the given name", async () => {
        const fn = () => {};

        actions.bind("count", fn);

        expect(actions.get("count")).toEqual(new Action(fn));
    });

    test("throws an error if an action is not registered", async () => {
        expect(() => actions.get("count")).toThrowError(
            new InvalidArgumentException("The given action [count] is not available."),
        );
    });
});
