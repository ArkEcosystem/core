import { plugin } from "../../../packages/core-event-emitter/src";
import { EventEmitter } from "../../../packages/core-event-emitter/src/emitter";

const emitter: EventEmitter = plugin.register();

let lastEmit: string;
describe("EventEmitter", () => {
    it("should listen for the event", () => {
        emitter.on("hello", data => (lastEmit = data));

        emitter.emit("hello", "world");

        expect(lastEmit).toBe("world");

        emitter.emit("hello", "world again");

        expect(lastEmit).toBe("world again");
    });

    it("should listen once for the event", () => {
        emitter.once("helloOnce", data => (lastEmit = data));

        emitter.emit("helloOnce", "world");

        expect(lastEmit).toBe("world");

        emitter.emit("helloOnce", "world again");

        expect(lastEmit).toBe("world");
    });

    it("should listen for the event and then remove the listener", () => {
        const callback = data => (lastEmit = data);

        emitter.on("helloOff", callback);

        emitter.emit("helloOff", "world");

        expect(lastEmit).toBe("world");

        emitter.off("helloOff", callback);

        emitter.emit("helloOff", "world again");

        expect(lastEmit).toBe("world");
    });

    it("should increase and decrease the max listener count", () => {
        expect(emitter.getMaxListeners()).toBe(10);

        for (let i = 0; i < 15; i++) {
            emitter.on("dummy", () => console.log("connected"));
        }

        expect(emitter.getMaxListeners()).toBe(15);

        for (let i = 0; i < 10; i++) {
            emitter.off("dummy", () => console.log("disconnected"));
        }

        expect(emitter.getMaxListeners()).toBe(5);
    });
});
