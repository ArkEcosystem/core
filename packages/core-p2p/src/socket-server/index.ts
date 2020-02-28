import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";
import SocketCluster from "socketcluster";

import { PeerService } from "../contracts";
import { requestSchemas } from "../schemas";
import { ServerError } from "./errors";
import { payloadProcessor } from "./payload-processor";
import { getHeaders } from "./utils/get-headers";
import { validate } from "./utils/validate";
import * as handlers from "./versions";

// todo: review implementation
export const startSocketServer = async (
    app: Contracts.Kernel.Application,
    service: PeerService,
    config: Record<string, any>,
): Promise<any> => {
    // when testing we also need to get socket files from dist folder
    // todo: get rid of thise, no test vars in production code
    const relativeSocketPath = process.env.CORE_ENV === "test" ? "/../../dist/socket-server" : "";

    const configuration = app.getTagged<Providers.PluginConfiguration>(
        Container.Identifiers.PluginConfiguration,
        "plugin",
        "@arkecosystem/core-p2p",
    );
    const getBlocksTimeout = configuration.getRequired<number>("getBlocksTimeout");
    const verifyTimeout = configuration.getRequired<number>("verifyTimeout");
    const blockMaxPayload = Managers.configManager
        .getMilestones()
        .reduce((acc, curr) => Math.max(acc, (curr.block || {}).maxPayload || 0), 0);
    // we don't have current height so use max value of maxPayload defined in milestones

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
            pingTimeout: Math.max(getBlocksTimeout, verifyTimeout),
            perMessageDeflate: false,
            maxPayload: blockMaxPayload + 10 * 1024, // 10KB margin vs block maxPayload to allow few additional chars for p2p message
        },
        ...config.server,
    });

    server.on("fail", data => app.log.error(data.message));

    // socketcluster types do not allow on("workerMessage") so casting as any
    (server as any).on("workerMessage", async (workerId, req, res) => {
        const [, version, method] = req.endpoint.split(".");

        try {
            if (requestSchemas[version]) {
                const requestSchema = requestSchemas[version][method];

                // data of type Buffer is ser/deserialized into { type: "Buffer", data } object
                // when it is sent from worker to master.
                // here we transform those back to Buffer (only 1st level properties).
                for (const key of Object.keys(req.data)) {
                    if (
                        req.data[key] && // avoids values like null
                        typeof req.data[key] === "object" &&
                        req.data[key].type === "Buffer" &&
                        req.data[key].data
                    ) {
                        req.data[key] = Buffer.from(req.data[key].data);
                    }
                }
                if (requestSchema) {
                    validate(requestSchema, req.data);
                }
            }

            return res(undefined, {
                data: (await handlers[version][method]({ app, service, req })) || {},
                headers: getHeaders(app),
            });
        } catch (error) {
            if (error instanceof ServerError) {
                return res(error);
            }

            app.log.error(error.message);
            return res(new Error(`${req.endpoint} responded with ${error.message}`));
        }
    });

    // Create a timeout promise so that if socket server is not ready in 10 seconds, it rejects
    const timeout: NodeJS.Timeout = setTimeout(() => {
        throw new Error("Socket server failed to setup in 10 seconds.");
    }, 10000);

    const serverReadyPromise = await new Promise(resolve => server.on("ready", () => resolve(server)));

    clearTimeout(timeout);

    payloadProcessor.inject(server);

    return serverReadyPromise;
};
