"use strict";
/**
 * @license
 * Copyright Daniel Imms <http://www.growingwiththeweb.com>
 * Released under MIT license. See LICENSE in the project root for details.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var NodeListIterator = /** @class */ (function () {
    /**
     * Creates an Iterator used to simplify the consolidate() method. It works by
     * making a shallow copy of the nodes in the root list and iterating over the
     * shallow copy instead of the source as the source will be modified.
     * @param start A node from the root list.
     */
    function NodeListIterator(start) {
        this._index = -1;
        this._items = [];
        var current = start;
        do {
            this._items.push(current);
            current = current.next;
        } while (start !== current);
    }
    /**
     * @return Whether there is a next node in the iterator.
     */
    NodeListIterator.prototype.hasNext = function () {
        return this._index < this._items.length - 1;
    };
    /**
     * @return The next node.
     */
    NodeListIterator.prototype.next = function () {
        return this._items[++this._index];
    };
    return NodeListIterator;
}());
exports.NodeListIterator = NodeListIterator;
//# sourceMappingURL=nodeListIterator.js.map