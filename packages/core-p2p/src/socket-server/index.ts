import { app } from "@arkecosystem/core-container";
import { Logger, P2P } from "@arkecosystem/core-interfaces";
import SocketCluster from "socketcluster";
import { SocketErrors } from "../enums";
import { getHeaders } from "./utils/get-headers";
import * as handlers from "./versions";

export const startSocketServer = async (service: P2P.IPeerService, config: Record<string, any>): Promise<any> => {
    // when testing we also need to get socket files from dist folder
    const relativeSocketPath = process.env.CORE_ENV === "test" ? "/../../dist/socket-server" : "";

    const server: SocketCluster = new SocketCluster({
        ...{
            appName: "core-p2p",
            brokers: 1,
            environment: process.env.CORE_NETWORK_NAME === "testnet" ? "dev" : "prod",
            rebootWorkerOnCrash: true,
            workerController: __dirname + `${relativeSocketPath}/worker.js`,
            workers: 2,
            wsEngine: "ws",
        },
        ...config.server,
    });

    server.on("fail", data => app.resolvePlugin<Logger.ILogger>("logger").error(data.message));

    // socketcluster types do not allow on("workerMessage") so casting as any
    (server as any).on("workerMessage", async (workerId, req, res) => {
        const [prefix, version, method] = req.endpoint.split(".");

        try {
            return res(null, {
                data: await handlers[version][method]({ service, req }),
                headers: getHeaders(),
            });
        } catch (e) {
            app.resolvePlugin<Logger.ILogger>("logger").error(e);

            if (e.name === SocketErrors.Validation) {
                return res(e);
            }

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
