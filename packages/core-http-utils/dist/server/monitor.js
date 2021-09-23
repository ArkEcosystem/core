"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitorServer = async (server) => {
    return server.register({
        plugin: require("@hapi/good"),
        options: {
            reporters: {
                console: [
                    {
                        module: "@hapi/good-squeeze",
                        name: "Squeeze",
                        args: [{ log: "*", response: "*", request: "*" }],
                    },
                    {
                        module: "@hapi/good-console",
                    },
                    "stdout",
                ],
            },
        },
    });
};
//# sourceMappingURL=monitor.js.map