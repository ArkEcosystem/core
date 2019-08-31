import "jest-extended";
import { MemoryEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/memory";

let emitter: MemoryEventDispatcher;
beforeEach(() => (emitter = new MemoryEventDispatcher()));

describe(".listen", () => {
    it("should add an event listener", async () => {
        const calls: number[] = [];
        emitter.listen("firstEvent", () => calls.push(1));
        emitter.listen("firstEvent", () => calls.push(2));

        await emitter.dispatch("firstEvent");

        expect(calls).toEqual([1, 2]);
    });

    it("should return an unsubcribe method for an event listener", async () => {
        const calls: number[] = [];
        const listener = () => calls.push(1);

        const off = emitter.listen("firstEvent", listener);
        await emitter.dispatch("firstEvent");
        expect(calls).toEqual([1]);

        off();
        await emitter.dispatch("firstEvent");
        expect(calls).toEqual([1]);
    });

    it("should prevent duplicate listeners", async () => {
        const calls: number[] = [];
        const listener = () => calls.push(1);

        emitter.listen("firstEvent", listener);
        emitter.listen("firstEvent", listener);
        emitter.listen("firstEvent", listener);

        await emitter.dispatch("firstEvent");

        expect(calls).toEqual([1]);
    });

    describe("Wildcard", () => {
        it("should add a wildcard listener", async () => {
            emitter.listen("*", ({ name, data }) => {
                expect(name).toBe("firstEvent");
                expect(data).toEqual(true);
            });

            await emitter.dispatch("firstEvent", true);
            await emitter.dispatchSeq("firstEvent", true);
        });
    });
});

describe(".listenMany", () => {
    it("should add many event listeners", async () => {
        const calls: number[] = [];
        emitter.listenMany([["firstEvent", () => calls.push(1)], ["firstEvent", () => calls.push(2)]]);

        await emitter.dispatch("firstEvent");

        expect(calls).toEqual([1, 2]);
    });

    it("should prevent duplicate listeners", async () => {
        const calls: number[] = [];
        const listener = () => calls.push(1);

        emitter.listenMany(new Array(5).fill(["firstEvent", listener]));

        await emitter.dispatch("firstEvent");

        expect(calls).toEqual([1]);
    });
});

describe(".listenOnce", () => {
    it("should listen once", async () => {
        let unicorn: boolean = false;

        expect(unicorn).toBeFalse();

        emitter.listenOnce("firstEvent", ({ data }) => (unicorn = data));

        emitter.dispatchSync("firstEvent", true);

        expect(unicorn).toBeTrue();

        emitter.dispatchSync("firstEvent", false);

        expect(unicorn).toBeTrue();
    });
});

describe(".forget", () => {
    it("should remove an event listener", () => {
        const calls: number[] = [];
        const listener = () => calls.push(1);

        emitter.listen("firstEvent", listener);

        emitter.dispatchSync("firstEvent");

        expect(calls).toEqual([1]);

        emitter.forget("firstEvent", listener);

        emitter.dispatchSync("firstEvent");

        expect(calls).toEqual([1]);
    });
});

describe(".dispatch", () => {
    it("should emit one event", async () => {
        emitter.listen("firstEvent", ({ data }) => expect(data).toEqual(true));

        await emitter.dispatch("firstEvent", true);
    });

    it("should emit multiple events", async () => {
        let count = 0;

        emitter.listen("firstEvent", () => {
            if (++count >= 5) {
                expect(count).toBe(5);
            }
        });

        await emitter.dispatch("firstEvent");
        await emitter.dispatch("firstEvent");
        await emitter.dispatch("firstEvent");
        await emitter.dispatch("firstEvent");
        await emitter.dispatch("firstEvent");
    });

    it("should not execute an event listener without await", async () => {
        let unicorn: boolean = false;

        emitter.listen("firstEvent", () => (unicorn = true));

        emitter.dispatch("firstEvent");

        expect(unicorn).toBeFalse();
    });
});

describe(".dispatchSeq", () => {
    it("should execute a wildcard listener with await", async () => {
        let unicorn: boolean = false;

        emitter.listen("*", () => (unicorn = true));

        await emitter.dispatchSeq("firstEvent");

        expect(unicorn).toBeTrue();
    });

    it("should not execute an event listener without await (async behaviour)", async () => {
        let unicorn: boolean = false;

        emitter.listen("firstEvent", () => (unicorn = true));

        emitter.dispatchSeq("firstEvent");

        expect(unicorn).toBeFalse();
    });

    it("should emit all events in sequence", async () => {
        const events: number[] = [];

        const listener = async (data: any) => {
            events.push(data);

            if (events.length >= 3) {
                expect(events).toEqual([1, 2, 3]);
            }
        };

        emitter.listen("firstEvent", () => listener(1));
        emitter.listen("firstEvent", () => listener(2));
        emitter.listen("firstEvent", () => listener(3));

        await emitter.dispatchSeq("firstEvent");
    });
});

describe(".dispatchSync", () => {
    it("should execute an event listener without await", () => {
        let unicorn: boolean = false;

        emitter.listen("firstEvent", () => (unicorn = true));

        emitter.dispatchSync("firstEvent");

        expect(unicorn).toBeTrue();
    });

    it("should execute a wildcard listener without await", () => {
        let unicorn: boolean = false;

        emitter.listen("*", () => (unicorn = true));

        emitter.dispatchSync("firstEvent");

        expect(unicorn).toBeTrue();
    });

    it("should emit all events in sequence", () => {
        const events: number[] = [];

        const listener = async (data: any) => {
            events.push(data);

            if (events.length >= 3) {
                expect(events).toEqual([1, 2, 3]);
            }
        };

        emitter.listen("firstEvent", () => listener(1));
        emitter.listen("firstEvent", () => listener(2));
        emitter.listen("firstEvent", () => listener(3));

        emitter.dispatchSync("firstEvent");
    });
});

describe(".dispatchMany", () => {
    it("should emit all events", async () => {
        const events: number[] = [];

        const listener = async (data: any) => {
            events.push(data);

            if (events.length >= 6) {
                expect(events).toEqual([1, 2, 3, 4, 5, 6]);
            }
        };

        emitter.listen("firstEvent", () => listener(1));
        emitter.listen("firstEvent", () => listener(2));
        emitter.listen("firstEvent", () => listener(3));

        emitter.listen("secondEvent", () => listener(4));
        emitter.listen("secondEvent", () => listener(5));
        emitter.listen("secondEvent", () => listener(6));

        await emitter.dispatchMany([["firstEvent", undefined], ["secondEvent", undefined]]);
    });
});

describe(".dispatchManySeq", () => {
    it("should emit all events", async () => {
        const events: number[] = [];

        const listener = async (data: any) => {
            events.push(data);

            if (events.length >= 6) {
                expect(events).toEqual([1, 2, 3, 4, 5, 6]);
            }
        };

        emitter.listen("firstEvent", () => listener(1));
        emitter.listen("firstEvent", () => listener(2));
        emitter.listen("firstEvent", () => listener(3));

        emitter.listen("secondEvent", () => listener(4));
        emitter.listen("secondEvent", () => listener(5));
        emitter.listen("secondEvent", () => listener(6));

        await emitter.dispatchManySeq([["firstEvent", undefined], ["secondEvent", undefined]]);
    });
});

describe(".dispatchManySync", () => {
    it("should emit all events", async () => {
        const events: number[] = [];

        const listener = async (data: any) => {
            events.push(data);

            if (events.length >= 6) {
                expect(events).toEqual([1, 2, 3, 4, 5, 6]);
            }
        };

        emitter.listen("firstEvent", () => listener(1));
        emitter.listen("firstEvent", () => listener(2));
        emitter.listen("firstEvent", () => listener(3));

        emitter.listen("secondEvent", () => listener(4));
        emitter.listen("secondEvent", () => listener(5));
        emitter.listen("secondEvent", () => listener(6));

        emitter.dispatchManySync([["firstEvent", undefined], ["secondEvent", undefined]]);
    });
});

describe(".flush", () => {
    it("should clear all listeners", async () => {
        const calls: string[] = [];

        emitter.listen("firstEvent", () => calls.push("firstEvent"));
        emitter.listen("secondEvent", () => calls.push("secondEvent"));
        emitter.listen("*", () => calls.push("any"));

        await emitter.dispatch("firstEvent");
        await emitter.dispatch("secondEvent");

        expect(calls).toEqual(["any", "firstEvent", "any", "secondEvent"]);

        emitter.flush();

        await emitter.dispatch("firstEvent");
        await emitter.dispatch("secondEvent");

        expect(calls).toEqual(["any", "firstEvent", "any", "secondEvent"]);
    });
});

describe(".forget", () => {
    it("should clear all listeners for an event", async () => {
        const calls: string[] = [];

        emitter.listen("firstEvent", () => calls.push("firstEvent"));
        emitter.listen("secondEvent", () => calls.push("secondEvent"));
        emitter.listen("*", () => calls.push("any"));

        await emitter.dispatch("firstEvent");
        await emitter.dispatch("secondEvent");

        expect(calls).toEqual(["any", "firstEvent", "any", "secondEvent"]);

        emitter.forget("firstEvent");

        await emitter.dispatch("firstEvent");
        await emitter.dispatch("secondEvent");

        expect(calls).toEqual(["any", "firstEvent", "any", "secondEvent", "any", "any", "secondEvent"]);
    });
});

describe(".forgetMany", () => {
    it("should forget the given listeners by name", async () => {
        const calls: string[] = [];

        emitter.listen("firstEvent", () => calls.push("firstEvent"));
        emitter.listen("secondEvent", () => calls.push("secondEvent"));
        emitter.listen("*", () => calls.push("any"));

        await emitter.dispatch("firstEvent");
        await emitter.dispatch("secondEvent");

        expect(calls).toEqual(["any", "firstEvent", "any", "secondEvent"]);

        emitter.forgetMany(["firstEvent", "secondEvent"]);

        await emitter.dispatch("firstEvent");
        await emitter.dispatch("secondEvent");

        expect(calls).toEqual(["any", "firstEvent", "any", "secondEvent", "any", "any"]);
    });

    it("should forget the given listeners by name and function signature", async () => {
        const calls: string[] = [];

        const firstEvent = () => calls.push("firstEvent");
        const secondEvent = () => calls.push("secondEvent");

        emitter.listen("firstEvent", firstEvent);
        emitter.listen("secondEvent", secondEvent);
        emitter.listen("*", () => calls.push("any"));

        await emitter.dispatch("firstEvent");
        await emitter.dispatch("secondEvent");

        expect(calls).toEqual(["any", "firstEvent", "any", "secondEvent"]);

        emitter.forgetMany([["firstEvent", firstEvent], ["secondEvent", secondEvent]]);

        await emitter.dispatch("firstEvent");
        await emitter.dispatch("secondEvent");

        expect(calls).toEqual(["any", "firstEvent", "any", "secondEvent", "any", "any"]);
    });
});

describe(".getListeners", () => {
    it("should return all listeners for the given event", () => {
        const listener = (): null => null;

        emitter.listen("firstEvent", listener);

        expect(emitter.getListeners("firstEvent")).toEqual([listener]);
    });
});

describe(".hasListeners", () => {
    it("should return true if a listener is registered", () => {
        emitter.listen("firstEvent", () => {});

        expect(emitter.hasListeners("firstEvent")).toBeTrue();
    });

    it("should return false if no listener is registered", () => {
        expect(emitter.hasListeners("firstEvent")).toBeFalse();
    });
});

describe(".countListeners", () => {
    it("should return the total listener count", () => {
        emitter.listen("firstEvent", () => null);
        emitter.listen("secondEvent", () => null);
        emitter.listen("*", () => null);

        expect(emitter.countListeners("firstEvent")).toBe(2);
        expect(emitter.countListeners("secondEvent")).toBe(2);
        expect(emitter.countListeners()).toBe(3);
    });
});
