"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// A Set that is capped in size and acts like a FIFO.
class CappedSet {
    constructor(maxSize = 16384) {
        this.data = new Set();
        this.maxSize = maxSize;
    }
    add(newElement) {
        if (this.data.size >= this.maxSize) {
            const oldest = this.data.values().next().value;
            this.data.delete(oldest);
        }
        this.data.add(newElement);
    }
    has(element) {
        return this.data.has(element);
    }
}
exports.CappedSet = CappedSet;
//# sourceMappingURL=capped-set.js.map