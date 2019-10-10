import { app } from "@arkecosystem/core-container";
import { Logger, P2P } from "@arkecosystem/core-interfaces";
import SocketCluster from "socketcluster";
import { SocketErrors } from "../enums";
import { requestSchemas } from "../schemas";
import { ServerError } from "./errors";
import { payloadProcessor } from "./payload-processor";
import { getHeaders } from "./utils/get-headers";
import { validate } from "./utils/validate";
import * as handlers from "./versions";

export const startSocketServer = async (service: P2P.IPeerService, config: Record<string, any>): Promise<any> => {
    // when testing we also need to get socket files from dist folder
    const relativeSocketPath = process.env.CORE_ENV === "test" ? "/../../dist/socket-server" : "";

    // https://socketcluster.io/#!/docs/api-socketcluster
    const server: SocketCluster = new SocketCluster({
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
            pingTimeout: Math.max(app.resolveOptions("p2p").getBlocksTimeout, app.resolveOptions("p2p").verifyTimeout),
            perMessageDeflate: true,
        },
        ...config.server,
    });

    server.on("fail", data => app.resolvePlugin<Logger.ILogger>("logger").error(data.message));

    // socketcluster types do not allow on("workerMessage") so casting as any
    (server as any).on("workerMessage", async (workerId, req, res) => {
        const [, version, method] = req.endpoint.split(".");

        try {
            if (requestSchemas[version]) {
                const requestSchema = requestSchemas[version][method];

                if (requestSchema) {
                    validate(requestSchema, req.data);
                }
            }

            return res(undefined, {
                data: (await handlers[version][method]({ service, req })) || {},
                headers: getHeaders(),
            });
        } catch (error) {
            if (error instanceof ServerError) {
                return res(error);
            }

            app.resolvePlugin<Logger.ILogger>("logger").error(error.message);

            return res(new Error(`${req.endpoint} responded with ${error.message}`));
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

    payloadProcessor.inject(server);

    return Promise.race([serverReadyPromise, timeoutPromise]);
};
