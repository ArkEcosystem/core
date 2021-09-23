"use strict";
exports.parse = (lines) => {
    function addHiddenProperties(scope, props) {
        for (const p of Object.keys(props)) {
            Object.defineProperty(scope, p, { enumerable: false, value: props[p] });
        }
    }
    const TreeNode = function (data, depth) {
        this.parent = null;
        addHiddenProperties(this, {
            data,
            depth,
            parent: null,
            children: [],
        });
        this[data || 'root'] = this.children;
    };
    TreeNode.prototype.toString = function () {
        return JSON.stringify(this.children);
    };
    const tree = new TreeNode(null, -1);
    const levels = [tree];
    function countTabs(line) {
        let count = 0;
        for (const i of Object.keys(line)) {
            const ch = line[i];
            if ((ch === '\t')) {
                count += 1;
            }
            else if (/[^\s]/.test(ch)) {
                return count;
            }
        }
        return -1; // no content
    }
    for (const i of Object.keys(lines)) {
        const line = lines[i];
        const tabcount = countTabs(line);
        if (tabcount >= 0) {
            // then add node to tree
            while (tabcount - levels[levels.length - 1].depth <= 0) {
                levels.pop();
            }
            const depth = levels.length - 1;
            const node = new TreeNode(line.substring(tabcount), depth);
            node.parent = levels[levels.length - 1];
            node.parent.children.push(node);
            levels.push(node);
        }
    }
    return tree;
};
exports.traverse = (tree, cb) => {
    function _traverse(node) {
        cb(node);
        for (const i of node.children.length) {
            _traverse(node.children[i]);
        }
    }
    for (const i of tree.children) {
        _traverse(tree.children[i]);
    }
};
exports.print = (tree) => {
    exports.traverse(tree, (node) => {
        let str = '';
        for (let i = 0; i < node.depth; i++) {
            str += '\t';
        }
        str += node.data;
    });
};
exports.toJSON = (tree) => {
    return JSON.stringify(tree.children);
};
//# sourceMappingURL=tabdown.js.map