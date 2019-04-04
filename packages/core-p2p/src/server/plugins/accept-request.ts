import Boom from "boom";
import { monitor } from "../../monitor";
import { isLocalHost, isWhitelisted } from "../../utils";

/**
 * The register method used by hapi.js.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
    const requiredHeaders = ["nethash", "version", "port", "os"];

    server.ext({
        type: "onRequest",
        async method(request, h) {
            const remoteAddress = request.info.remoteAddress;

            if (request.path.startsWith("/config")) {
                return h.continue;
            }

            if (request.headers["x-auth"] === "forger" || request.path.startsWith("/remote")) {
                return isWhitelisted(options.whitelist, remoteAddress) ? h.continue : Boom.forbidden();
            }

            // Only forger requests are internal
            if (request.path.startsWith("/internal")) {
                return Boom.forbidden();
            }

            if (!monitor.guard) {
                return Boom.serverUnavailable("Peer Monitor not ready");
            }

            if (request.path.startsWith("/peer")) {
                const peer = { ip: remoteAddress };

                requiredHeaders.forEach(key => {
                    peer[key] = request.headers[key];
                });

                try {
                    if (!isLocalHost(peer.ip)) {
                        if (request.method === "post") {
                            const accepted = await monitor.acceptNewPeer(peer);
                            if (!accepted) {
                                return Boom.forbidden();
                            }
                        } else {
                            monitor.acceptNewPeer(peer);
                        }
                    }
                } catch (error) {
                    return Boom.badImplementation(error.message);
                }
            }

            return h.continue;
        },
    });
};

/**
 * The struct used by hapi.js.
 * @type {Object}
 */
export const plugin = {
    name: "accept-request",
    version: "0.1.0",
    register,
};
