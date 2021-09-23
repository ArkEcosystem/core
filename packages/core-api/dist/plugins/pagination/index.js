"use strict";
// Based on https://github.com/fknop/hapi-pagination
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const decorate_1 = require("./decorate");
const ext_1 = require("./ext");
exports.plugin = {
    name: "hapi-pagination",
    version: "1.0.0",
    register(server, options) {
        const { error, config } = config_1.getConfig(options);
        if (error) {
            throw error;
        }
        try {
            server.decorate("toolkit", "paginate", decorate_1.decorate().paginate);
        }
        catch (_a) {
            //
        }
        const ext = new ext_1.Ext(config);
        server.ext("onPreHandler", (request, h) => ext.onPreHandler(request, h));
        server.ext("onPostHandler", (request, h) => ext.onPostHandler(request, h));
    },
};
//# sourceMappingURL=index.js.map