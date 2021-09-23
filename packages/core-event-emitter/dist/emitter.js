"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
class EventEmitter extends events_1.EventEmitter {
    on(event, listener) {
        this.ensureListenerCount(event, (maxListeners) => maxListeners + 1);
        return super.on(event, listener);
    }
    off(event, listener) {
        return this.removeListener(event, listener);
    }
    once(event, listener) {
        this.ensureListenerCount(event, (maxListeners) => maxListeners + 1);
        return super.once(event, listener);
    }
    addListener(event, listener) {
        return this.on(event, listener);
    }
    removeListener(event, listener) {
        this.ensureListenerCount(event, (maxListeners) => maxListeners - 1);
        return super.removeListener(event, listener);
    }
    ensureListenerCount(event, count) {
        const maxListeners = this.getMaxListeners();
        const listenerCount = this.listenerCount(event);
        if (listenerCount >= maxListeners) {
            this.setMaxListeners(count(maxListeners));
        }
    }
}
exports.EventEmitter = EventEmitter;
//# sourceMappingURL=emitter.js.map