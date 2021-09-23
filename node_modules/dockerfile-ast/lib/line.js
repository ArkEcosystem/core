"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Line {
    constructor(document, range) {
        this.document = document;
        this.range = range;
    }
    getRange() {
        return this.range;
    }
    getTextContent() {
        return this.document.getText().substring(this.document.offsetAt(this.range.start), this.document.offsetAt(this.range.end));
    }
    isAfter(line) {
        return this.range.start.line > line.range.start.line;
    }
    isBefore(line) {
        return this.range.start.line < line;
    }
}
exports.Line = Line;
