import EventEmitter from "eventemitter3";

export const plugin = {
    pkg: require("../package.json"),
    alias: "event-emitter",
    register() {
        return new EventEmitter();
    },
};
