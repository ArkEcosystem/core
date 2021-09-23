"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = require("immutable");
class OrderedCappedMap {
    constructor(maxSize) {
        this.store = immutable_1.OrderedMap();
        this.resize(maxSize);
    }
    get(key) {
        return this.store.get(key);
    }
    set(key, value) {
        if (this.store.size >= this.maxSize) {
            this.store = this.store.delete(this.store.keyOf(this.first()));
        }
        this.store = this.store.set(key, value);
    }
    has(key) {
        return this.store.has(key);
    }
    delete(key) {
        if (!this.store.has(key)) {
            return false;
        }
        this.store = this.store.delete(key);
        return !this.store.has(key);
    }
    clear() {
        this.store = this.store.clear();
    }
    resize(maxSize) {
        this.maxSize = maxSize;
        if (this.store.size > this.maxSize) {
            this.store = this.store.takeLast(this.maxSize);
        }
    }
    first() {
        return this.store.first();
    }
    last() {
        return this.store.last();
    }
    keys() {
        return this.store.keySeq().toArray();
    }
    values() {
        return this.store.valueSeq().toArray();
    }
    count() {
        return this.store.size;
    }
}
exports.OrderedCappedMap = OrderedCappedMap;
//# sourceMappingURL=ordered-capped-map.js.map