import { EventEmitter } from "./emitter";

export const plugin = {
    pkg: require("../package.json"),
    alias: "event-emitter",
    register() {
        return new EventEmitter();
    },
};
