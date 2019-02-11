import SocketCluster from "socketcluster";

import * as peerHandlers from "./versions/peer";

/**
 * Create a new hapi.js server.
 * @param  {Object} config
 * @return {Hapi.Server}
 */
const startSocketServer = async config => {
    const server = new SocketCluster({
        workers: 1,
        brokers: 1,
        port: 8000,
        appName: "core-p2p",

        // Switch wsEngine to 'sc-uws' for a performance boost (beta)
        wsEngine: "ws",

        /* A JS file which you can use to configure each of your
         * workers/servers - This is where most of your backend code should go
         */
        workerController: __dirname + "/worker.js",

        /* JS file which you can use to configure each of your
         * brokers - Useful for scaling horizontally across multiple machines (optional)
         */
        brokerController: __dirname + "/broker.js",

        // Whether or not to reboot the worker in case it crashes (defaults to true)
        rebootWorkerOnCrash: true,
    });

    server.on("workerStart", workerInfo => {
        console.log("Worker started");
    });

    server.on("workerMessage", (workerId, data, res) => {
        const handlers = {
            peer: peerHandlers,
        };

        const [prefix, version, method] = data.endpoint.split(".");
        return handlers[version][method].handler(data, res); // TODO handle errors
    });

    return server;
};

export { startSocketServer };
