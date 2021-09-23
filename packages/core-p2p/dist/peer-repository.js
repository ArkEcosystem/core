"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PeerRepository {
    constructor() {
        this.repository = new Map();
    }
    all() {
        return this.repository;
    }
    entries() {
        return [...this.repository.entries()];
    }
    keys() {
        return [...this.repository.keys()];
    }
    values() {
        return [...this.repository.values()];
    }
    pull(key) {
        const item = this.repository.get(key);
        this.forget(key);
        return item;
    }
    get(key) {
        return this.repository.get(key);
    }
    set(key, value) {
        this.repository.set(key, value);
    }
    forget(key) {
        this.repository.delete(key);
    }
    flush() {
        this.repository.clear();
    }
    has(key) {
        return !!this.get(key);
    }
    missing(key) {
        return !this.has(key);
    }
    count() {
        return this.repository.size;
    }
    isEmpty() {
        return this.repository.size <= 0;
    }
    isNotEmpty() {
        return !this.isEmpty();
    }
    random() {
        return this.repository.get(this.keys()[Math.floor(Math.random() * this.count())]);
    }
    toJson() {
        const items = {};
        for (const [key, value] of this.repository.entries()) {
            items[key] = value;
        }
        return JSON.stringify(items);
    }
}
exports.PeerRepository = PeerRepository;
//# sourceMappingURL=peer-repository.js.map