import "jest-extended";

import { Contracts } from "@packages/core-kernel/src";
import { MemoryEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/memory";

class DummyClass implements Contracts.Kernel.EventListener {
    public constructor(private readonly method?) {}

    public handle(): void {
        this.method();
    }
}

let emitter: MemoryEventDispatcher;

beforeEach(() => (emitter = new MemoryEventDispatcher()));

describe("MemoryEventDispatcher", () => {
    let dummyCaller: jest.Mock;
    let dummyListener: any;

    beforeEach(() => {
        dummyCaller = jest.fn();
        dummyListener = new DummyClass(dummyCaller);
    });

    describe(".listen", () => {
        it("should add an event listener", async () => {
            emitter.listen("firstEvent", dummyListener);
            emitter.listen("firstEvent", new DummyClass(dummyCaller));

            await emitter.dispatch("firstEvent");

            expect(dummyCaller).toHaveBeenCalledTimes(2);
        });

        it("should return an unsubcribe method for an event listener", async () => {
            const off = emitter.listen("firstEvent", dummyListener);
            await emitter.dispatch("firstEvent");
            expect(dummyCaller).toHaveBeenCalled();

            off();
            await emitter.dispatch("firstEvent");
            expect(dummyCaller).toHaveBeenCalledTimes(1);
        });

        it("should prevent duplicate listeners", async () => {
            emitter.listen("firstEvent", dummyListener);
            emitter.listen("firstEvent", dummyListener);
            emitter.listen("firstEvent", dummyListener);

            await emitter.dispatch("firstEvent");

            expect(dummyCaller).toHaveBeenCalled();
        });

        describe("Wildcard", () => {
            it("should add a wildcard listener", async () => {
                emitter.listen("*", dummyListener);

                await emitter.dispatch("firstEvent");
                await emitter.dispatchSeq("firstEvent");

                expect(dummyCaller).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe(".listenMany", () => {
        it("should add many event listeners", async () => {
            emitter.listenMany([
                ["firstEvent", dummyListener],
                ["firstEvent", new DummyClass(dummyCaller)],
            ]);

            await emitter.dispatch("firstEvent");

            expect(dummyCaller).toHaveBeenCalledTimes(2);
        });

        it("should prevent duplicate listeners", async () => {
            emitter.listenMany(new Array(5).fill(["firstEvent", dummyListener]));

            await emitter.dispatch("firstEvent");

            expect(dummyCaller).toHaveBeenCalled();
        });
    });

    describe(".listenOnce", () => {
        it("should listen once", async () => {
            emitter.listenOnce("firstEvent", dummyListener);

            emitter.dispatchSync("firstEvent");
            emitter.dispatchSync("firstEvent");
            emitter.dispatchSync("firstEvent");

            expect(dummyCaller).toHaveBeenCalled();

            emitter.dispatchSync("firstEvent");
            emitter.dispatchSync("firstEvent");
            emitter.dispatchSync("firstEvent");

            expect(dummyCaller).toHaveBeenCalledTimes(1);
        });
    });

    describe(".forget", () => {
        it("should remove an event listener", () => {
            emitter.listen("firstEvent", dummyListener);

            emitter.dispatchSync("firstEvent");

            expect(dummyCaller).toHaveBeenCalled();

            emitter.forget("firstEvent", dummyListener);

            emitter.dispatchSync("firstEvent");

            expect(dummyCaller).toHaveBeenCalledTimes(1);
        });
    });

    describe(".dispatch", () => {
        it("should emit one event", async () => {
            emitter.listen("firstEvent", dummyListener);

            await emitter.dispatch("firstEvent");

            expect(dummyCaller).toHaveBeenCalled();
        });

        it("should emit multiple events", async () => {
            emitter.listen("firstEvent", dummyListener);

            await emitter.dispatch("firstEvent");
            await emitter.dispatch("firstEvent");
            await emitter.dispatch("firstEvent");
            await emitter.dispatch("firstEvent");
            await emitter.dispatch("firstEvent");

            expect(dummyCaller).toHaveBeenCalledTimes(5);
        });

        it("should not execute an event listener without await", async () => {
            emitter.listen("firstEvent", dummyListener);

            emitter.dispatch("firstEvent");

            expect(dummyCaller).not.toHaveBeenCalled();
        });
    });

    describe(".dispatchSeq", () => {
        it("should execute a wildcard listener with await", async () => {
            emitter.listen("*", dummyListener);

            await emitter.dispatchSeq("firstEvent");

            expect(dummyCaller).toHaveBeenCalled();
        });

        it("should not execute an event listener without await (async behaviour)", async () => {
            emitter.listen("firstEvent", dummyListener);

            emitter.dispatchSeq("firstEvent");

            expect(dummyCaller).not.toHaveBeenCalled();
        });

        it("should emit all events in sequence", async () => {
            emitter.listen("firstEvent", dummyListener);
            emitter.listen("firstEvent", new DummyClass(dummyCaller));
            emitter.listen("firstEvent", new DummyClass(dummyCaller));

            await emitter.dispatchSeq("firstEvent");

            expect(dummyCaller).toHaveBeenCalledTimes(3);
        });
    });

    describe(".dispatchSync", () => {
        it("should execute an event listener without await", () => {
            emitter.listen("firstEvent", dummyListener);

            emitter.dispatchSync("firstEvent");

            expect(dummyCaller).toHaveBeenCalled();
        });

        it("should execute a wildcard listener without await", () => {
            emitter.listen("*", dummyListener);

            emitter.dispatchSync("firstEvent");

            expect(dummyCaller).toHaveBeenCalled();
        });

        it("should emit all events in sequence", () => {
            emitter.listen("firstEvent", dummyListener);
            emitter.listen("firstEvent", new DummyClass(dummyCaller));
            emitter.listen("firstEvent", new DummyClass(dummyCaller));

            emitter.dispatchSync("firstEvent");

            expect(dummyCaller).toHaveBeenCalledTimes(3);
        });
    });

    describe(".dispatchMany", () => {
        it("should emit all events", async () => {
            emitter.listen("firstEvent", new DummyClass(dummyCaller));
            emitter.listen("firstEvent", new DummyClass(dummyCaller));
            emitter.listen("firstEvent", new DummyClass(dummyCaller));

            emitter.listen("secondEvent", new DummyClass(dummyCaller));
            emitter.listen("secondEvent", new DummyClass(dummyCaller));
            emitter.listen("secondEvent", new DummyClass(dummyCaller));

            await emitter.dispatchMany([
                ["firstEvent", undefined],
                ["secondEvent", undefined],
            ]);

            expect(dummyCaller).toHaveBeenCalledTimes(6);
        });
    });

    describe(".dispatchManySeq", () => {
        it("should emit all events", async () => {
            emitter.listen("firstEvent", new DummyClass(dummyCaller));
            emitter.listen("firstEvent", new DummyClass(dummyCaller));
            emitter.listen("firstEvent", new DummyClass(dummyCaller));

            emitter.listen("secondEvent", new DummyClass(dummyCaller));
            emitter.listen("secondEvent", new DummyClass(dummyCaller));
            emitter.listen("secondEvent", new DummyClass(dummyCaller));

            await emitter.dispatchManySeq([
                ["firstEvent", undefined],
                ["secondEvent", undefined],
            ]);

            expect(dummyCaller).toHaveBeenCalledTimes(6);
        });
    });

    describe(".dispatchManySync", () => {
        it("should emit all events", async () => {
            emitter.listen("firstEvent", new DummyClass(dummyCaller));
            emitter.listen("firstEvent", new DummyClass(dummyCaller));
            emitter.listen("firstEvent", new DummyClass(dummyCaller));

            emitter.listen("secondEvent", new DummyClass(dummyCaller));
            emitter.listen("secondEvent", new DummyClass(dummyCaller));
            emitter.listen("secondEvent", new DummyClass(dummyCaller));

            emitter.dispatchManySync([
                ["firstEvent", undefined],
                ["secondEvent", undefined],
            ]);

            expect(dummyCaller).toHaveBeenCalledTimes(6);
        });
    });

    describe(".flush", () => {
        it("should clear all listeners", async () => {
            emitter.listen("firstEvent", dummyListener);
            emitter.listen("secondEvent", dummyListener);
            emitter.listen("*", dummyListener);

            await emitter.dispatch("firstEvent");
            await emitter.dispatch("secondEvent");

            expect(dummyCaller).toHaveBeenCalledTimes(4);

            emitter.flush();

            await emitter.dispatch("firstEvent");
            await emitter.dispatch("secondEvent");

            expect(dummyCaller).toHaveBeenCalledTimes(4);
        });
    });

    describe(".forget", () => {
        it("should clear all listeners for an event", async () => {
            emitter.listen("firstEvent", dummyListener);
            emitter.listen("secondEvent", dummyListener);
            emitter.listen("*", dummyListener);

            await emitter.dispatch("firstEvent");
            await emitter.dispatch("secondEvent");

            expect(dummyCaller).toHaveBeenCalledTimes(4);

            emitter.forget("firstEvent");

            await emitter.dispatch("firstEvent");
            await emitter.dispatch("secondEvent");

            expect(dummyCaller).toHaveBeenCalledTimes(7);
        });
    });

    describe(".forgetMany", () => {
        it("should forget the given listeners by name", async () => {
            emitter.listen("firstEvent", dummyListener);
            emitter.listen("secondEvent", dummyListener);
            emitter.listen("*", dummyListener);

            await emitter.dispatch("firstEvent");
            await emitter.dispatch("secondEvent");

            expect(dummyCaller).toHaveBeenCalledTimes(4);

            emitter.forgetMany(["firstEvent", "secondEvent"]);

            await emitter.dispatch("firstEvent");
            await emitter.dispatch("secondEvent");

            expect(dummyCaller).toHaveBeenCalledTimes(6);
        });

        it("should forget the given listeners by name and function signature", async () => {
            const firstEvent = new DummyClass(dummyCaller);
            const secondEvent = new DummyClass(dummyCaller);

            emitter.listen("firstEvent", firstEvent);
            emitter.listen("secondEvent", secondEvent);
            emitter.listen("*", new DummyClass(dummyCaller));

            await emitter.dispatch("firstEvent");
            await emitter.dispatch("secondEvent");

            expect(dummyCaller).toHaveBeenCalledTimes(4);

            emitter.forgetMany([
                ["firstEvent", firstEvent],
                ["secondEvent", secondEvent],
            ]);

            await emitter.dispatch("firstEvent");
            await emitter.dispatch("secondEvent");

            expect(dummyCaller).toHaveBeenCalledTimes(6);
        });
    });

    describe(".getListeners", () => {
        it("should return all listeners", () => {
            emitter.listen("firstEvent", dummyListener);
            emitter.listen("secondEvent", dummyListener);

            expect(emitter.getListeners()).toEqual([dummyListener, dummyListener]);
        });

        it("should return all listeners for the given event", () => {
            emitter.listen("firstEvent", dummyListener);
            emitter.listen("secondEvent", dummyListener);

            expect(emitter.getListeners("firstEvent")).toEqual([dummyListener]);
        });
    });

    describe(".hasListeners", () => {
        it("should return true if a listener is registered", () => {
            emitter.listen("firstEvent", dummyListener);

            expect(emitter.hasListeners("firstEvent")).toBeTrue();
        });

        it("should return false if no listener is registered", () => {
            expect(emitter.hasListeners("firstEvent")).toBeFalse();
        });
    });

    describe(".countListeners", () => {
        it("should return the total listener count", () => {
            emitter.listen("firstEvent", dummyListener);
            emitter.listen("secondEvent", dummyListener);
            emitter.listen("*", dummyListener);

            expect(emitter.countListeners("firstEvent")).toBe(2);
            expect(emitter.countListeners("secondEvent")).toBe(2);
            expect(emitter.countListeners()).toBe(3);
        });
    });
});
