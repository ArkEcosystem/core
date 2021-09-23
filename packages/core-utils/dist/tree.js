"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Node {
    constructor(parent) {
        this.values = {};
        this.parent = parent;
    }
    getStruct() {
        return {
            values: this.values,
            lastValueAdded: this.lastValueAdded,
            left: this.left ? this.left.getStruct() : undefined,
            right: this.right ? this.right.getStruct() : undefined,
            parent: this.parent ? this.parent.lastValueAdded : undefined,
        };
    }
}
class Tree {
    constructor(compareFunction) {
        this.root = new Node();
        this.compareFunction = compareFunction;
    }
    getAll() {
        const all = [];
        this.getFromChildNodes(this.root, all);
        return all;
    }
    getValuesLastToFirst(limit) {
        const values = [];
        this.getFromChildNodesReverseOrder(this.root, values, limit);
        return values;
    }
    getLast() {
        let currentNode = this.root;
        for (;;) {
            if (!currentNode.right) {
                break;
            } // currentNode is the rightest node
            currentNode = currentNode.right;
        }
        return Object.values(currentNode.values);
    }
    getAllStrictlyBelow(max) {
        const all = [];
        this.getAllStrictlyBelowFromChildNodes(max, this.root, all);
        return all;
    }
    getAllStrictlyBetween(min, max) {
        const all = [];
        this.getAllStrictlyBetweenFromChildNodes(min, max, this.root, all);
        return all;
    }
    insert(id, value) {
        let node = this.root;
        for (;;) {
            if (!node.lastValueAdded) {
                node.values[id] = value;
                node.lastValueAdded = value;
                return;
            }
            const cmp = this.compareFunction(value, node.lastValueAdded);
            if (cmp > 0) {
                node = this.getOrCreateRightNode(node);
            }
            else if (cmp < 0) {
                node = this.getOrCreateLeftNode(node);
            }
            else {
                // exact match, add to the node values
                node.values[id] = value;
                node.lastValueAdded = value;
                return;
            }
        }
    }
    // This method is a bit dumb (to be properly implemented it would need to be like
    // the array sort method), but it helps for testing.
    find(id, value) {
        const node = this.findNode(value);
        return node ? node.values[id] : undefined;
    }
    remove(id, value) {
        const node = this.findNode(value);
        if (!node) {
            return;
        }
        // Remove from the node values
        if (node.values[id]) {
            delete node.values[id];
        }
        // Still other values in the node ? If yes we don't need to remove the node
        if (Object.keys(node.values).length) {
            return;
        }
        node.lastValueAdded = undefined;
        // No more values, node needs to be deleted
        this.removeNode(node);
    }
    isEmpty() {
        if (this.root.lastValueAdded) {
            return false;
        }
        return true;
    }
    getCompareFunction() {
        return this.compareFunction;
    }
    toJSON(node = this.root) {
        return JSON.stringify(node.getStruct(), undefined, 2);
    }
    findMin(node) {
        let currentNode = node;
        for (;;) {
            if (!currentNode.left) {
                break;
            } // currentNode is the leftest node
            currentNode = currentNode.left;
        }
        return currentNode;
    }
    findNode(value) {
        let currentNode = this.root;
        for (;;) {
            if (!currentNode || !currentNode.lastValueAdded) {
                return undefined;
            }
            const cmp = this.compareFunction(value, currentNode.lastValueAdded);
            if (cmp > 0) {
                currentNode = currentNode.right;
            }
            else if (cmp < 0) {
                currentNode = currentNode.left;
            }
            else {
                // found
                return currentNode;
            }
        }
    }
    removeNode(node) {
        if (!node.left && !node.right) {
            // Node is a leaf and thus has no children.
            if (node.parent) {
                // Node has a parent. Just remove the pointer to this node from the parent.
                this.removeChild(node.parent, node);
            }
        }
        else if (node.left && node.right) {
            // Node has two children.
            // Find the next biggest value (minimum value in the right branch)
            // and replace current value node with that next biggest value.
            const nextBiggerNode = this.findMin(node.right);
            if (this.compareFunction(nextBiggerNode.lastValueAdded, node.right.lastValueAdded) !== 0) {
                this.removeNode(nextBiggerNode);
                node.values = { ...nextBiggerNode.values };
                node.lastValueAdded = nextBiggerNode.lastValueAdded;
            }
            else {
                // In case if next right value is the next bigger one and it doesn't have left child
                // then just replace node that is going to be deleted with the right node.
                node.values = node.right.values;
                node.lastValueAdded = node.right.lastValueAdded;
                node.right = node.right.right;
                if (node.right) {
                    node.right.parent = node;
                }
            }
        }
        else {
            // Node has only one child.
            // Make this child to be a direct child of current node's parent.
            const child = node.left || node.right;
            if (node.parent) {
                this.replaceChild(node.parent, node, child);
            }
            else {
                // only the root has no parent, replace root with child
                this.root = child;
                this.root.parent = undefined;
            }
        }
    }
    removeChild(node, child) {
        if (node.left === child) {
            node.left = undefined;
        }
        else if (node.right === child) {
            node.right = undefined;
        }
    }
    replaceChild(node, toReplace, replaceBy) {
        replaceBy.parent = node;
        if (node.left === toReplace) {
            node.left = replaceBy;
        }
        else if (node.right === toReplace) {
            node.right = replaceBy;
        }
    }
    getAllStrictlyBelowFromChildNodes(max, node, all) {
        if (node.left) {
            this.getAllStrictlyBelowFromChildNodes(max, node.left, all);
        }
        if (!node.lastValueAdded) {
            return; // should only be when tree is empty
        }
        const cmpCurrentToMax = this.compareFunction(node.lastValueAdded, max);
        if (cmpCurrentToMax < 0) {
            // we are below max
            all.push(...Object.values(node.values));
            if (node.right) {
                // we are strictly below max, fetch from right nodes
                this.getAllStrictlyBelowFromChildNodes(max, node.right, all);
            }
        }
    }
    getAllStrictlyBetweenFromChildNodes(min, max, node, all) {
        if (!node.lastValueAdded) {
            return; // should only be when tree is empty
        }
        const cmpCurrentToMin = this.compareFunction(node.lastValueAdded, min);
        const cmpCurrentToMax = this.compareFunction(node.lastValueAdded, max);
        if (cmpCurrentToMin > 0) {
            if (node.left) {
                // we are above min, we can fetch from left node
                this.getAllStrictlyBetweenFromChildNodes(min, max, node.left, all);
            }
            if (cmpCurrentToMax < 0) {
                // threshold is between min and max
                all.push(...Object.values(node.values));
            }
        }
        if (cmpCurrentToMax < 0 && node.right) {
            // we are below max, we can fetch from right node
            this.getAllStrictlyBetweenFromChildNodes(min, max, node.right, all);
        }
    }
    getFromChildNodes(node, all, limit) {
        if (node.left) {
            this.getFromChildNodes(node.left, all);
        }
        if (limit && all.length >= limit) {
            return;
        }
        all.push(...Object.values(node.values));
        if (node.right) {
            this.getFromChildNodes(node.right, all);
        }
    }
    getFromChildNodesReverseOrder(node, all, limit) {
        if (node.right) {
            this.getFromChildNodesReverseOrder(node.right, all, limit);
        }
        if (limit && all.length >= limit) {
            return;
        }
        all.push(...Object.values(node.values));
        if (node.left) {
            this.getFromChildNodesReverseOrder(node.left, all, limit);
        }
    }
    getOrCreateLeftNode(node) {
        node.left = node.left || new Node(node);
        return node.left;
    }
    getOrCreateRightNode(node) {
        node.right = node.right || new Node(node);
        return node.right;
    }
}
exports.Tree = Tree;
//# sourceMappingURL=tree.js.map