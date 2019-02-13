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

    const server = new SocketCluster({
        workers: 1,
        brokers: 1,
        port: 4000, // TODO get from config
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
        };

        if (data.endpoint === "config.getHandlers") {
            return res(null, {
                peer: Object.keys(peerHandlers),
                internal: Object.keys(internalHandlers),
            });
        }

        const [prefix, version, method] = data.endpoint.split(".");

        try {
            const result = (await handlers[version][method](data)) || {};
            result.headers = getHeaders();

            return res(null, result);
        } catch (e) {
            const logger = app.resolvePlugin("logger");
            logger.debug(e);
            return res(e); // TODO explicit error message
        }
    });

    return new Promise((resolve, reject) => {
        server.on("ready", () => resolve(server));
        // TODO wait a bit and reject (timeout)
    });
};

export { startSocketServer };
