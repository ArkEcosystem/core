import { app } from "@arkecosystem/core-container";
import SocketCluster from "socketcluster";
import { getHeaders } from "./plugins/get-headers";

/**
 * Create a new socketcluster server.
 * @param  {Object} config
 * @return {Object}
 */
const startSocketServer = async config => {
    const peerHandlers = require("./versions/peer");
    const internalHandlers = require("./versions/internal");
    const utilsHandlers = require("./versions/utils");

    const server = new SocketCluster({
        workers: 1,
        brokers: 1,
        port: config.port,
        appName: "core-p2p",

        wsEngine: "ws",
        workerController: __dirname + "/worker.js",
        brokerController: __dirname + "/broker.js",
        rebootWorkerOnCrash: true,
    });

    server.on("workerMessage", async (workerId, data, res) => {
        const handlers = {
            peer: peerHandlers,
            internal: internalHandlers,
            utils: utilsHandlers, // not publicly exposed, only used between worker / master
        };

        const [prefix, version, method] = data.endpoint.split(".");

        try {
            const result = (await handlers[version][method](data)) || {};
            result.headers = getHeaders();

            return res(null, result);
        } catch (e) {
            const logger = app.resolvePlugin("logger");
            logger.error(e);
            return res(new Error(`Socket call to ${data.endpoint} failed.`));
        }
    });

    // Create a promise that rejects in 10 seconds
    // TODO configurable timeout ?
    const timeoutPromise = new Promise((resolve, reject) => {
        const id = setTimeout(() => {
            clearTimeout(id);
            reject("Socket server failed to setup in 10 seconds.");
        }, 10000);
    });
    const serverReadyPromise = new Promise((resolve, reject) => {
        server.on("ready", () => resolve(server));
    });

    return Promise.race([serverReadyPromise, timeoutPromise]);
};

export { startSocketServer };
