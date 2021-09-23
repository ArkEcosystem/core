"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const crypto_1 = require("@arkecosystem/crypto");
const socketcluster_1 = __importDefault(require("socketcluster"));
const schemas_1 = require("../schemas");
const errors_1 = require("./errors");
const payload_processor_1 = require("./payload-processor");
const get_headers_1 = require("./utils/get-headers");
const validate_1 = require("./utils/validate");
const handlers = __importStar(require("./versions"));
exports.startSocketServer = async (service, config) => {
    // when testing we also need to get socket files from dist folder
    const relativeSocketPath = process.env.CORE_ENV === "test" ? "/../../dist/socket-server" : "";
    const blockMaxPayload = crypto_1.Managers.configManager
        .getMilestones()
        .reduce((acc, curr) => Math.max(acc, (curr.block || {}).maxPayload || 0), 0);
    // we don't have current height so use max value of maxPayload defined in milestones
    // https://socketcluster.io/#!/docs/api-socketcluster
    const server = new socketcluster_1.default({
        ...{
            appName: "core-p2p",
            brokers: 1,
            environment: process.env.CORE_NETWORK_NAME === "testnet" ? "dev" : "prod",
            rebootWorkerOnCrash: true,
            workerController: __dirname + `${relativeSocketPath}/worker.js`,
            workers: 2,
            wsEngine: "ws",
            // See https://github.com/SocketCluster/socketcluster/issues/506 about
            // details on how pingTimeout works.
            pingTimeout: Math.max(core_container_1.app.resolveOptions("p2p").getBlocksTimeout, core_container_1.app.resolveOptions("p2p").verifyTimeout),
            perMessageDeflate: false,
            maxPayload: blockMaxPayload + 10 * 1024,
        },
        ...config.server,
    });
    server.on("fail", data => core_container_1.app.resolvePlugin("logger").error(data.message));
    // socketcluster types do not allow on("workerMessage") so casting as any
    server.on("workerMessage", async (workerId, req, res) => {
        const [, version, method] = req.endpoint.split(".");
        try {
            if (schemas_1.requestSchemas[version]) {
                const requestSchema = schemas_1.requestSchemas[version][method];
                // data of type Buffer is ser/deserialized into { type: "Buffer", data } object
                // when it is sent from worker to master.
                // here we transform those back to Buffer (only 1st level properties).
                for (const key of Object.keys(req.data)) {
                    if (req.data[key] && // avoids values like null
                        typeof req.data[key] === "object" &&
                        req.data[key].type === "Buffer" &&
                        req.data[key].data) {
                        req.data[key] = Buffer.from(req.data[key].data);
                    }
                }
                if (requestSchema) {
                    validate_1.validate(requestSchema, req.data);
                }
            }
            return res(undefined, {
                data: (await handlers[version][method]({ service, req })) || {},
                headers: get_headers_1.getHeaders(),
            });
        }
        catch (error) {
            if (error instanceof errors_1.ServerError) {
                return res(error);
            }
            core_container_1.app.resolvePlugin("logger").error(error.message);
            return res(new Error(`${req.endpoint} responded with ${error.message}`));
        }
    });
    // Create a timeout promise so that if socket server is not ready in 10 seconds, it rejects
    const timeout = setTimeout(() => {
        throw new Error("Socket server failed to setup in 10 seconds.");
    }, 10000);
    const serverReadyPromise = await new Promise(resolve => server.on("ready", () => resolve(server)));
    clearTimeout(timeout);
    payload_processor_1.payloadProcessor.inject(server);
    return serverReadyPromise;
};
//# sourceMappingURL=index.js.map