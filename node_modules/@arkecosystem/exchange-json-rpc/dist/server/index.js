"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const hapi_1 = require("@hapi/hapi");
const rpc = __importStar(require("@hapist/json-rpc"));
const whitelist = __importStar(require("@hapist/whitelist"));
const logger_1 = require("../services/logger");
const network_1 = require("../services/network");
const methods_1 = require("./methods");
async function startServer(options, onlyCreate) {
    if (options.allowRemote) {
        logger_1.logger.warn("Server allows remote connections. This is a potential security risk!");
    }
    const server = new hapi_1.Server({
        host: options.host,
        port: options.port,
    });
    if (!options.allowRemote) {
        await server.register({
            // @ts-ignore
            plugin: whitelist,
            options: {
                whitelist: options.whitelist,
            },
        });
    }
    await server.register({
        // @ts-ignore
        plugin: rpc,
        options: {
            methods: methods_1.methods,
            processor: {
                schema: {
                    properties: {
                        id: {
                            type: ["number", "string"],
                        },
                        jsonrpc: {
                            pattern: "2.0",
                            type: "string",
                        },
                        method: {
                            type: "string",
                        },
                        params: {
                            type: "object",
                        },
                    },
                    required: ["jsonrpc", "method", "id"],
                    type: "object",
                },
                validate(data, schema) {
                    try {
                        const { error } = crypto_1.Validation.validator.validate(schema, data);
                        return { value: data, error: error ? error : null };
                    }
                    catch (error) {
                        return { value: null, error: error.stack };
                    }
                },
            },
        },
    });
    await network_1.network.init({
        network: options.network,
        peer: options.peer,
        maxLatency: options.maxLatency,
        peerPort: options.peerPort,
    });
    if (!onlyCreate) {
        await server.start();
        logger_1.logger.info(`Exchange JSON-RPC running on ${server.info.uri}`);
    }
    return server;
}
exports.startServer = startServer;
//# sourceMappingURL=index.js.map