"use strict";
/**
 * @license
 * Copyright Daniel Imms <http://www.growingwiththeweb.com>
 * Released under MIT license. See LICENSE in the project root for details.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var node_1 = require("./node");
var nodeListIterator_1 = require("./nodeListIterator");
var FibonacciHeap = /** @class */ (function () {
    function FibonacciHeap(compare) {
        this._minNode = null;
        this._nodeCount = 0;
        this._compare = compare ? compare : this._defaultCompare;
    }
    /**
     * Clears the heap's data, making it an empty heap.
     */
    FibonacciHeap.prototype.clear = function () {
        this._minNode = null;
        this._nodeCount = 0;
    };
    /**
     * Decreases a key of a node.
     * @param node The node to decrease the key of.
     * @param newKey The new key to assign to the node.
     */
    FibonacciHeap.prototype.decreaseKey = function (node, newKey) {
        if (!node) {
            throw new Error('Cannot decrease key of non-existent node');
        }
        if (this._compare({ key: newKey }, { key: node.key }) > 0) {
            throw new Error('New key is larger than old key');
        }
        node.key = newKey;
        var parent = node.parent;
        if (parent && this._compare(node, parent) < 0) {
            this._cut(node, parent, this._minNode);
            this._cascadingCut(parent, this._minNode);
        }
        if (this._compare(node, this._minNode) < 0) {
            this._minNode = node;
        }
    };
    /**
     * Deletes a node.
     * @param node The node to delete.
     */
    FibonacciHeap.prototype.delete = function (node) {
        // This is a special implementation of decreaseKey that sets the argument to
        // the minimum value. This is necessary to make generic keys work, since there
        // is no MIN_VALUE constant for generic types.
        var parent = node.parent;
        if (parent) {
            this._cut(node, parent, this._minNode);
            this._cascadingCut(parent, this._minNode);
        }
        this._minNode = node;
        this.extractMinimum();
    };
    /**
     * Extracts and returns the minimum node from the heap.
     * @return The heap's minimum node or null if the heap is empty.
     */
    FibonacciHeap.prototype.extractMinimum = function () {
        var extractedMin = this._minNode;
        if (extractedMin) {
            // Set parent to null for the minimum's children
            if (extractedMin.child) {
                var child = extractedMin.child;
                do {
                    child.parent = null;
                    child = child.next;
                } while (child !== extractedMin.child);
            }
            var nextInRootList = null;
            if (extractedMin.next !== extractedMin) {
                nextInRootList = extractedMin.next;
            }
            // Remove min from root list
            this._removeNodeFromList(extractedMin);
            this._nodeCount--;
            // Merge the children of the minimum node with the root list
            this._minNode = this._mergeLists(nextInRootList, extractedMin.child);
            if (this._minNode) {
                this._minNode = this._consolidate(this._minNode);
            }
        }
        return extractedMin;
    };
    /**
     * Returns the minimum node from the heap.
     * @return The heap's minimum node or null if the heap is empty.
     */
    FibonacciHeap.prototype.findMinimum = function () {
        return this._minNode;
    };
    /**
     * Inserts a new key-value pair into the heap.
     * @param key The key to insert.
     * @param value The value to insert.
     * @return node The inserted node.
     */
    FibonacciHeap.prototype.insert = function (key, value) {
        var node = new node_1.Node(key, value);
        this._minNode = this._mergeLists(this._minNode, node);
        this._nodeCount++;
        return node;
    };
    /**
     * @return Whether the heap is empty.
     */
    FibonacciHeap.prototype.isEmpty = function () {
        return this._minNode === null;
    };
    /**
     * @return The size of the heap.
     */
    FibonacciHeap.prototype.size = function () {
        if (this._minNode === null) {
            return 0;
        }
        return this._getNodeListSize(this._minNode);
    };
    /**
     * Joins another heap to this heap.
     * @param other The other heap.
     */
    FibonacciHeap.prototype.union = function (other) {
        this._minNode = this._mergeLists(this._minNode, other._minNode);
        this._nodeCount += other._nodeCount;
    };
    /**
     * Compares two nodes with each other.
     * @param a The first key to compare.
     * @param b The second key to compare.
     * @return -1, 0 or 1 if a < b, a == b or a > b respectively.
     */
    FibonacciHeap.prototype._defaultCompare = function (a, b) {
        if (a.key > b.key) {
            return 1;
        }
        if (a.key < b.key) {
            return -1;
        }
        return 0;
    };
    /**
     * Cut the link between a node and its parent, moving the node to the root list.
     * @param node The node being cut.
     * @param parent The parent of the node being cut.
     * @param minNode The minimum node in the root list.
     * @return The heap's new minimum node.
     */
    FibonacciHeap.prototype._cut = function (node, parent, minNode) {
        node.parent = null;
        parent.degree--;
        if (node.next === node) {
            parent.child = null;
        }
        else {
            parent.child = node.next;
        }
        this._removeNodeFromList(node);
        var newMinNode = this._mergeLists(minNode, node);
        node.isMarked = false;
        return newMinNode;
    };
    /**
     * Perform a cascading cut on a node; mark the node if it is not marked,
     * otherwise cut the node and perform a cascading cut on its parent.
     * @param node The node being considered to be cut.
     * @param minNode The minimum node in the root list.
     * @return The heap's new minimum node.
     */
    FibonacciHeap.prototype._cascadingCut = function (node, minNode) {
        var parent = node.parent;
        if (parent) {
            if (node.isMarked) {
                minNode = this._cut(node, parent, minNode);
                minNode = this._cascadingCut(parent, minNode);
            }
            else {
                node.isMarked = true;
            }
        }
        return minNode;
    };
    /**
     * Merge all trees of the same order together until there are no two trees of
     * the same order.
     * @param minNode The current minimum node.
     * @return The new minimum node.
     */
    FibonacciHeap.prototype._consolidate = function (minNode) {
        var aux = [];
        var it = new nodeListIterator_1.NodeListIterator(minNode);
        while (it.hasNext()) {
            var current = it.next();
            // If there exists another node with the same degree, merge them
            var auxCurrent = aux[current.degree];
            while (auxCurrent) {
                if (this._compare(current, auxCurrent) > 0) {
                    var temp = current;
                    current = auxCurrent;
                    auxCurrent = temp;
                }
                this._linkHeaps(auxCurrent, current);
                aux[current.degree] = null;
                current.degree++;
                auxCurrent = aux[current.degree];
            }
            aux[current.degree] = current;
        }
        var newMinNode = null;
        for (var i = 0; i < aux.length; i++) {
            var node = aux[i];
            if (node) {
                // Remove siblings before merging
                node.next = node;
                node.prev = node;
                newMinNode = this._mergeLists(newMinNode, node);
            }
        }
        return newMinNode;
    };
    /**
     * Removes a node from a node list.
     * @param node The node to remove.
     */
    FibonacciHeap.prototype._removeNodeFromList = function (node) {
        var prev = node.prev;
        var next = node.next;
        prev.next = next;
        next.prev = prev;
        node.next = node;
        node.prev = node;
    };
    /**
     * Links two heaps of the same order together.
     *
     * @private
     * @param max The heap with the larger root.
     * @param min The heap with the smaller root.
     */
    FibonacciHeap.prototype._linkHeaps = function (max, min) {
        this._removeNodeFromList(max);
        min.child = this._mergeLists(max, min.child);
        max.parent = min;
        max.isMarked = false;
    };
    /**
     * Merge two lists of nodes together.
     *
     * @private
     * @param a The first list to merge.
     * @param b The second list to merge.
     * @return The new minimum node from the two lists.
     */
    FibonacciHeap.prototype._mergeLists = function (a, b) {
        if (!a) {
            if (!b) {
                return null;
            }
            return b;
        }
        if (!b) {
            return a;
        }
        var temp = a.next;
        a.next = b.next;
        a.next.prev = a;
        b.next = temp;
        b.next.prev = b;
        return this._compare(a, b) < 0 ? a : b;
    };
    /**
     * Gets the size of a node list.
     * @param node A node within the node list.
     * @return The size of the node list.
     */
    FibonacciHeap.prototype._getNodeListSize = function (node) {
        var count = 0;
        var current = node;
        do {
            count++;
            if (current.child) {
                count += this._getNodeListSize(current.child);
            }
            current = current.next;
        } while (current !== node);
        return count;
    };
    return FibonacciHeap;
}());
exports.FibonacciHeap = FibonacciHeap;
//# sourceMappingURL=fibonacciHeap.js.map