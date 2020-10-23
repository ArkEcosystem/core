import { InvalidArgumentException } from "@packages/core-kernel/src/exceptions/logic";
import { Action, Triggers } from "@packages/core-kernel/src/services/triggers";
import { ActionArguments } from "@packages/core-kernel/src/types";

class DummyAction extends Action {
    public execute<T>(args: ActionArguments): T {
        return args.returnValue;
    }
}

class DummyActionWithException extends Action {
    public execute<T>(): T {
        throw new Error("Hello World");
    }
}

let triggers: Triggers;

beforeEach(() => (triggers = new Triggers()));

describe("Triggers", () => {
    describe("bind", () => {
        it("binds a trigger and accepts arguments for calls", async () => {
            const before: jest.Mock = jest.fn();

            triggers.bind("count", new DummyAction()).before(before);

            await expect(
                triggers.call<boolean>("count", {
                    returnValue: "Hello World",
                }),
            ).resolves.toBe("Hello World");
            expect(before).toHaveBeenCalled();
        });

        it("binds a trigger and throws error from execute", async () => {
            const before: jest.Mock = jest.fn();

            triggers.bind("count", new DummyActionWithException()).before(before);

            await expect(
                triggers.call<boolean>("count", {
                    returnValue: "Hello World",
                }),
            ).rejects.toThrowError();
            expect(before).toHaveBeenCalled();
        });

        it("binds a trigger with a <before> hook and executes them", async () => {
            const before: jest.Mock = jest.fn();

            triggers.bind("count", new DummyAction()).before(before);

            await expect(triggers.call<boolean>("count")).resolves.toBeUndefined();
            expect(before).toHaveBeenCalled();
        });

        it("binds a trigger with an <error> hook and executes them", async () => {
            const error: jest.Mock = jest.fn();

            triggers.bind("count", new DummyActionWithException()).error(error);

            await expect(triggers.call<boolean>("count")).resolves.toBeUndefined();
            expect(error).toHaveBeenCalled();
        });

        it("binds a trigger with an <after> hook and executes them", async () => {
            const after: jest.Mock = jest.fn();

            triggers.bind("count", new DummyAction()).after(after);

            await expect(triggers.call<boolean>("count")).resolves.toBeUndefined();
            expect(after).toHaveBeenCalled();
        });

        it("binds a trigger with <before/error/after> hooks and executes them", async () => {
            const before: jest.Mock = jest.fn();
            const error: jest.Mock = jest.fn();
            const after: jest.Mock = jest.fn();

            triggers.bind("count", new DummyActionWithException()).before(before).error(error).after(after);

            await expect(triggers.call<boolean>("count")).resolves.toBeUndefined();
            expect(before).toHaveBeenCalled();
            expect(error).toHaveBeenCalled();
            expect(after).not.toHaveBeenCalled();
        });

        it("throws an error if a trigger is not registered", async () => {
            await expect(triggers.call("count")).rejects.toThrowError(
                new InvalidArgumentException("The given trigger [count] is not available."),
            );
        });

        it("throws an error if a trigger is already registered", async () => {
            triggers.bind("duplicate", new DummyAction());

            expect(() => {
                triggers.bind("duplicate", new DummyAction());
            }).toThrowError(new InvalidArgumentException("The given trigger [duplicate] is already registered."));
        });

        it("throws an error if a trigger is reserved", async () => {
            expect(() => {
                triggers.bind("internal.trigger", new DummyAction());
            }).toThrowError(new InvalidArgumentException("The given trigger [internal.trigger] is reserved."));
        });
    });

    describe("unbind", () => {
        it("returns and remove the trigger", async () => {
            triggers.bind("count", new DummyAction());

            expect(triggers.get("count")).toBeInstanceOf(DummyAction);

            expect(triggers.unbind("count")).toBeInstanceOf(Action);

            expect(() => triggers.get("count")).toThrowError(
                new InvalidArgumentException("The given trigger [count] is not available."),
            );
        });

        it("throws an error if a trigger is not registered", async () => {
            expect(() => triggers.unbind("count")).toThrowError(
                new InvalidArgumentException("The given trigger [count] is not available."),
            );
        });
    });

    describe("rebind", () => {
        it("returns new trigger and replaces it", async () => {
            const trigger1 = new DummyAction();
            const trigger2 = new DummyAction();

            triggers.bind("count", trigger1);

            expect(triggers.get("count")).toBe(trigger1);

            expect(triggers.rebind("count", trigger2)).toBe(trigger2);

            expect(triggers.get("count")).toBe(trigger2);
        });

        it("throws an error if a trigger is not registered", async () => {
            expect(() => triggers.rebind("count", new DummyAction())).toThrowError(
                new InvalidArgumentException("The given trigger [count] is not available."),
            );
        });
    });

    describe("get", () => {
        it("returns a trigger by name", async () => {
            triggers.bind("count", new DummyAction());

            expect(triggers.get("count")).toBeInstanceOf(Action);
        });

        it("throws an error if a trigger is not registered", async () => {
            expect(() => triggers.get("count")).toThrowError(
                new InvalidArgumentException("The given trigger [count] is not available."),
            );
        });
    });

    describe("error handling", () => {
        const dummyParams = {
            returnValue: false,
        };

        it("should call error action if error is thrown on <before> hook", async () => {
            const before: jest.Mock = jest.fn().mockImplementation(() => {
                throw new Error();
            });
            const error: jest.Mock = jest.fn();
            triggers.bind("count", new DummyAction()).before(before).error(error);

            await expect(triggers.call<boolean>("count", dummyParams)).resolves.toBeUndefined();
            expect(before).toHaveBeenCalled();
            expect(error).toHaveBeenLastCalledWith(dummyParams, undefined, new Error(), "before");
        });

        it("should throw error if error is thrown on <before> hook and no error handlers are defined", async () => {
            const before: jest.Mock = jest.fn().mockImplementation(() => {
                throw new Error();
            });
            triggers.bind("count", new DummyAction()).before(before);

            await expect(triggers.call<boolean>("count", dummyParams)).rejects.toThrowError();
            expect(before).toHaveBeenCalled();
        });

        it("should call error action if error is thrown on execute", async () => {
            const error: jest.Mock = jest.fn();
            triggers.bind("count", new DummyActionWithException()).error(error);

            await expect(triggers.call<boolean>("count", dummyParams)).resolves.toBeUndefined();
            expect(error).toHaveBeenLastCalledWith(dummyParams, undefined, new Error("Hello World"), "execute");
        });

        it("should throw error if error is thrown on execute and no error handlers are defined", async () => {
            triggers.bind("count", new DummyActionWithException());

            await expect(triggers.call<boolean>("count")).rejects.toThrowError();
        });

        it("should call error action and return result if error is thrown on <after> hook", async () => {
            const after: jest.Mock = jest.fn().mockImplementation(() => {
                throw new Error();
            });
            const error: jest.Mock = jest.fn();
            triggers.bind("count", new DummyAction()).after(after).error(error);

            await expect(triggers.call<boolean>("count", dummyParams)).resolves.toBe(dummyParams.returnValue);
            expect(after).toHaveBeenCalled();
            expect(error).toHaveBeenLastCalledWith(dummyParams, dummyParams.returnValue, new Error(), "after");
        });

        it("should throw error if error is thrown on <after> hook and no error handlers are defined", async () => {
            const after: jest.Mock = jest.fn().mockImplementation(() => {
                throw new Error();
            });
            triggers.bind("count", new DummyAction()).after(after);

            await expect(triggers.call<boolean>("count", dummyParams)).rejects.toThrowError();
            expect(after).toHaveBeenCalled();
        });
    });
});
