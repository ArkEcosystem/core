"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_utils_1 = require("@arkecosystem/core-utils");
const assert_1 = __importDefault(require("assert"));
class BlockStore {
    constructor(maxSize) {
        this.byId = new core_utils_1.OrderedCappedMap(maxSize);
        this.byHeight = new core_utils_1.OrderedCappedMap(maxSize);
    }
    get(key) {
        return typeof key === "string" ? this.byId.get(key) : this.byHeight.get(key);
    }
    set(value) {
        const lastBlock = this.last();
        assert_1.default.strictEqual(value.data.height, lastBlock ? lastBlock.data.height + 1 : 1);
        this.byId.set(value.data.id, value.data);
        this.byHeight.set(value.data.height, value.data);
        this.lastBlock = value;
    }
    has(value) {
        return this.byId.has(value.id) || this.byHeight.has(value.height);
    }
    delete(value) {
        this.byId.delete(value.id);
        this.byHeight.delete(value.height);
    }
    clear() {
        this.byId.clear();
        this.byHeight.clear();
    }
    resize(maxSize) {
        this.byId.resize(maxSize);
        this.byHeight.resize(maxSize);
    }
    last() {
        return this.lastBlock;
    }
    values() {
        return this.byId.values();
    }
    count() {
        return this.byId.count();
    }
    getIds() {
        return this.byId.keys();
    }
    getHeights() {
        return this.byHeight.keys();
    }
}
exports.BlockStore = BlockStore;
//# sourceMappingURL=blocks.js.map