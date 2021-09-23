"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_http_utils_1 = require("@arkecosystem/core-http-utils");
const Handlebars = __importStar(require("handlebars"));
const handler_1 = require("./handler");
exports.startServer = async (config) => {
    const server = await core_http_utils_1.createServer({
        host: config.host,
        port: config.port,
    }, instance => instance.views({
        engines: { html: Handlebars },
        relativeTo: __dirname,
        path: "templates",
    }), [require("@hapi/vision")]);
    server.route({
        method: "GET",
        path: "/",
        handler: handler_1.handler,
    });
    return core_http_utils_1.mountServer("Vote Report", server);
};
//# sourceMappingURL=server.js.map