"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const boom_1 = __importDefault(require("@hapi/boom"));
const hapi_1 = __importDefault(require("@hapi/hapi"));
const deepmerge_1 = __importDefault(require("deepmerge"));
const expand_home_dir_1 = __importDefault(require("expand-home-dir"));
const fs_1 = require("fs");
const trailing_slash_1 = require("../plugins/trailing-slash");
const monitor_1 = require("./monitor");
exports.createServer = async (options, callback, plugins) => {
    if (options.tls) {
        options.tls.key = fs_1.readFileSync(expand_home_dir_1.default(options.tls.key)).toString();
        options.tls.cert = fs_1.readFileSync(expand_home_dir_1.default(options.tls.cert)).toString();
    }
    options = deepmerge_1.default({
        routes: {
            payload: {
                async failAction(request, h, err) {
                    return boom_1.default.badData(err.message);
                },
            },
            validate: {
                async failAction(request, h, err) {
                    return boom_1.default.badData(err.message);
                },
            },
        },
    }, options);
    const server = new hapi_1.default.Server(options);
    if (Array.isArray(plugins)) {
        for (const plugin of plugins) {
            await server.register(plugin);
        }
    }
    await server.register(trailing_slash_1.trailingSlash);
    if (callback) {
        await callback(server);
    }
    if (process.env.NODE_ENV === "test") {
        await monitor_1.monitorServer(server);
    }
    return server;
};
//# sourceMappingURL=create.js.map