"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var children = new Map();
var sessionIdIndex = 0;
exports.registry = {
    bookId: function () {
        return "x:" + sessionIdIndex++;
    },
    register: function (id, actor) {
        children.set(id, actor);
        return id;
    },
    get: function (id) {
        return children.get(id);
    },
    free: function (id) {
        children.delete(id);
    }
};
