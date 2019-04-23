import { plugin } from "../../../packages/core-event-emitter/src";
import { EventEmitter } from "../../../packages/core-event-emitter/src/emitter";

const emitter = plugin.register();

let lastEmit;
beforeAll(() => {
    emitter.on("fake", data => {
        lastEmit = data;
    });
});

describe("Event Manager", () => {
    it("should be an instance", () => {
        expect(emitter).toBeInstanceOf(EventEmitter);
    });

    it("should emit the event", () => {
        emitter.emit("fake", "news");

        expect(lastEmit).toBe("news");
    });
});
