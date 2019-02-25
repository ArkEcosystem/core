import EventEmitter from "eventemitter3";
import { plugin } from "../../../packages/core-event-emitter/src";

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
