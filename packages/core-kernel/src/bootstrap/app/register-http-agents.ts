import http from "http";
import https from "https";

import { injectable } from "../../ioc";
import { Bootstrapper } from "../interfaces";

// `keepAlive` exists on every Agent but is missing from the @types/node version in use
type KeepAliveAgent = { keepAlive: boolean };

/**
 * Node.js >= 19 enables keep-alive on the global agents, so requests reuse pooled sockets.
 * Core's API server destroys the socket after every response while still advertising
 * keep-alive, and a request sent on such a socket fails with `ECONNRESET`. Restore the
 * behaviour of earlier Node.js versions and open a new connection per request.
 *
 * The existing agents are changed instead of replaced, so their other defaults
 * (proxy configuration, timeouts) stay intact.
 *
 * @export
 * @class RegisterHttpAgents
 * @implements {Bootstrapper}
 */
@injectable()
export class RegisterHttpAgents implements Bootstrapper {
    /**
     * @returns {Promise<void>}
     * @memberof RegisterHttpAgents
     */
    public async bootstrap(): Promise<void> {
        for (const agent of [http.globalAgent, https.globalAgent]) {
            (agent as unknown as KeepAliveAgent).keepAlive = false;
        }
    }
}
