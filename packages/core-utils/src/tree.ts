/* tslint:disable:max-classes-per-file */
type CompareFunction<T> = (a: T, b: T) => number;

class Node<T> {
    public values: { [id: string]: T } = {};
    public lastValueAdded: T;
    public left: Node<T> | undefined;
    public right: Node<T> | undefined;
    public parent: Node<T> | undefined;

    constructor(parent?: Node<T>) {
        this.parent = parent;
    }

    public getStruct() {
        return {
            values: this.values,
            lastValueAdded: this.lastValueAdded,
            left: this.left ? this.left.getStruct() : undefined,
            right: this.right ? this.right.getStruct() : undefined,
            parent: this.parent ? this.parent.lastValueAdded : undefined,
        };
    }
}

export class Tree<T> {
    private root: Node<T>;
    private compareFunction: CompareFunction<T>;

    constructor(compareFunction: CompareFunction<T>) {
        this.root = new Node();
        this.compareFunction = compareFunction;
    }

    public getAll(): T[] {
        const all = [];
        this.getFromChildNodes(this.root, all);
        return all;
    }

    public getValuesLastToFirst(limit: number): T[] {
        const values = [];
        this.getFromChildNodesReverseOrder(this.root, values, limit);
        return values;
    }

    public getLast(): T[] {
        let currentNode = this.root;
        for (;;) {
            if (!currentNode.right) {
                break;
            } // currentNode is the rightest node
            currentNode = currentNode.right;
        }
        return Object.values(currentNode.values);
    }

    public getAllStrictlyBelow(max: T): T[] {
        const all: T[] = [];
        this.getAllStrictlyBelowFromChildNodes(max, this.root, all);
        return all;
    }

    public getAllStrictlyBetween(min: T, max: T): T[] {
        const all: T[] = [];
        this.getAllStrictlyBetweenFromChildNodes(min, max, this.root, all);
        return all;
    }

    public insert(id: string, value: T): void {
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
            } else if (cmp < 0) {
                node = this.getOrCreateLeftNode(node);
            } else {
                // exact match, add to the node values
                node.values[id] = value;
                node.lastValueAdded = value;
                return;
            }
        }
    }

    // This method is a bit dumb (to be properly implemented it would need to be like
    // the array sort method), but it helps for testing.
    public find(id: string, value: T): T | undefined {
        const node = this.findNode(value);
        return node ? node.values[id] : undefined;
    }

    public remove(id: string, value: T): void {
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

    public isEmpty(): boolean {
        if (this.root.lastValueAdded) {
            return false;
        }
        return true;
    }

    public getCompareFunction(): CompareFunction<T> {
        return this.compareFunction;
    }

    public toJSON(node: Node<T> = this.root): string {
        return JSON.stringify(node.getStruct(), undefined, 2);
    }

    private findMin(node: Node<T>): Node<T> {
        let currentNode = node;
        for (;;) {
            if (!currentNode.left) {
                break;
            } // currentNode is the leftest node
            currentNode = currentNode.left;
        }
        return currentNode;
    }

    private findNode(value: T): Node<T> | undefined {
        let currentNode = this.root;
        for (;;) {
            if (!currentNode || !currentNode.lastValueAdded) {
                return undefined;
            }

            const cmp = this.compareFunction(value, currentNode.lastValueAdded);
            if (cmp > 0) {
                currentNode = currentNode.right;
            } else if (cmp < 0) {
                currentNode = currentNode.left;
            } else {
                // found
                return currentNode;
            }
        }
    }

    private removeNode(node: Node<T>): void {
        if (!node.left && !node.right) {
            // Node is a leaf and thus has no children.
            if (node.parent) {
                // Node has a parent. Just remove the pointer to this node from the parent.
                this.removeChild(node.parent, node);
            }
        } else if (node.left && node.right) {
            // Node has two children.
            // Find the next biggest value (minimum value in the right branch)
            // and replace current value node with that next biggest value.
            const nextBiggerNode = this.findMin(node.right);
            if (this.compareFunction(nextBiggerNode.lastValueAdded, node.right.lastValueAdded) !== 0) {
                this.removeNode(nextBiggerNode);

                node.values = { ...nextBiggerNode.values };
                node.lastValueAdded = nextBiggerNode.lastValueAdded;
            } else {
                // In case if next right value is the next bigger one and it doesn't have left child
                // then just replace node that is going to be deleted with the right node.
                node.values = node.right.values;
                node.lastValueAdded = node.right.lastValueAdded;
                node.right = node.right.right;
                if (node.right) {
                    node.right.parent = node;
                }
            }
        } else {
            // Node has only one child.
            // Make this child to be a direct child of current node's parent.
            const child = node.left || node.right;

            if (node.parent) {
                this.replaceChild(node.parent, node, child);
            } else {
                // only the root has no parent, replace root with child
                this.root = child;
                this.root.parent = undefined;
            }
        }
    }

    private removeChild(node: Node<T>, child: Node<T>): void {
        if (node.left === child) {
            node.left = undefined;
        } else if (node.right === child) {
            node.right = undefined;
        }
    }

    private replaceChild(node: Node<T>, toReplace: Node<T>, replaceBy: Node<T>): void {
        replaceBy.parent = node;
        if (node.left === toReplace) {
            node.left = replaceBy;
        } else if (node.right === toReplace) {
            node.right = replaceBy;
        }
    }

    private getAllStrictlyBelowFromChildNodes(max: T, node: Node<T>, all: T[]): void {
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

    private getAllStrictlyBetweenFromChildNodes(min: T, max: T, node: Node<T>, all: T[]): void {
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

    private getFromChildNodes(node: Node<T>, all: T[], limit?: number): void {
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

    private getFromChildNodesReverseOrder(node: Node<T>, all: T[], limit?: number): void {
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

    private getOrCreateLeftNode(node: Node<T>): Node<T> {
        node.left = node.left || new Node(node);
        return node.left;
    }

    private getOrCreateRightNode(node: Node<T>): Node<T> {
        node.right = node.right || new Node(node);
        return node.right;
    }
}
