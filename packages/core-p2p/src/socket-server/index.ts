import { app } from "@arkecosystem/core-container";
import SocketCluster from "socketcluster";
import { getHeaders } from "./utils/get-headers";

/**
 * Create a new socketcluster server.
 * @param  {Object} config
 * @return {Object}
 */
const startSocketServer = async config => {
    const peerHandlers = require("./versions/peer");
    const internalHandlers = require("./versions/internal");
    const utilsHandlers = require("./versions/utils");

    // when testing we also need to get socket files from dist folder
    const relativeSocketPath = process.env.CORE_ENV === "test" ? "/../../dist/socket-server" : "";

    const server = new SocketCluster({
        workers: 1,
        brokers: 1,
        port: config.port,
        appName: "core-p2p",

        wsEngine: "ws",
        workerController: __dirname + `${relativeSocketPath}/worker.js`,
        brokerController: __dirname + `${relativeSocketPath}/broker.js`,
        rebootWorkerOnCrash: true,
    });

    server.on("workerMessage", async (workerId, req, res) => {
        const handlers = {
            peer: peerHandlers,
            internal: internalHandlers,
            utils: utilsHandlers, // not publicly exposed, only used between worker / master
        };

        const [prefix, version, method] = req.endpoint.split(".");

        try {
            const result = {
                data: (await handlers[version][method](req)) || {},
                headers: getHeaders(),
            };

            return res(null, result);
        } catch (e) {
            const logger = app.resolvePlugin("logger");
            logger.error(e);
            return res(new Error(`Socket call to ${req.endpoint} failed.`));
        }
    });

    // Create a timeout promise so that if socket server is not ready in 10 seconds, it rejects
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
