"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Argument {
    constructor(value, range) {
        this.value = value;
        this.range = range;
    }
    toString() {
        return this.value;
    }
    getRange() {
        return this.range;
    }
    getValue() {
        return this.value;
    }
    isAfter(position) {
        if (this.range.end.line < position.line) {
            return false;
        }
        return this.range.start.line > position.line ? true : this.range.start.character > position.character;
    }
    isBefore(position) {
        if (this.range.start.line < position.line) {
            return true;
        }
        return this.range.end.line > position.line ? false : this.range.end.character < position.character;
    }
}
exports.Argument = Argument;
