import { app } from "@arkecosystem/core-container";
import { Blockchain, Logger, P2P } from "@arkecosystem/core-interfaces";
import { dato, Dato } from "@faustbrian/dato";
import Joi from "joi";
import socketCluster from "socketcluster-client";
import util from "util";
import { config as localConfig } from "./config";
import { guard } from "./court";
import { PeerPingTimeoutError, PeerStatusResponseError, PeerVerificationFailedError } from "./errors";
import { PeerVerificationResult, PeerVerifier } from "./peer-verifier";
import { replySchemas } from "./reply-schemas";
import { SocketErrors } from "./socket-server/constants";
import { socketEmit } from "./utils/socket";

export class Peer implements P2P.IPeer {
    public downloadSize: any;
    public hashid: string;
    public nethash: any;
    public version: any;
    public os: any;
    public delay: any;
    public ban: number;
    public offences: any[];

    public headers: {
        version: string;
        port: number;
        nethash: number;
        height: number | null;
        "Content-Type": "application/json";
        hashid?: string;
    };

    public socket;
    public socketError: string | null;

    public state: any;
    public url: string;
    public lastPinged: Dato | null;
    public verification: PeerVerificationResult | null;

    private config: any;
    private logger: Logger.ILogger;

    /**
     * @constructor
     * @param  {String} ip
     * @param  {Number} port
     */
    constructor(public readonly ip, public readonly port) {
        this.logger = app.resolvePlugin<Logger.ILogger>("logger");
        this.config = app.getConfig();

        this.ban = new Date().getTime();
        this.url = `${port % 443 === 0 ? "https://" : "http://"}${ip}:${port}`;
        this.state = {};
        this.offences = [];
        this.lastPinged = null;
        this.verification = null;

        this.headers = {
            version: app.getVersion(),
            port: localConfig.get("port"),
            nethash: this.config.get("network.nethash"),
            height: null,
            "Content-Type": "application/json",
        };

        if (this.config.get("network.name") !== "mainnet") {
            this.headers.hashid = app.getHashid();
        }

        this.socket = socketCluster.create({
            port,
            hostname: ip,
        });
        this.socket.on("error", err => {
            this.logger.debug(`Error catched: "${err}"`);
            guard.suspend(this);
        });
        this.socketError = null;
    }

    /**
     * Set the given headers for the peer.
     * @param  {Object} headers
     * @return {void}
     */
    public setHeaders(headers) {
        ["nethash", "os", "version"].forEach(key => {
            this[key] = headers[key];
        });
    }

    /**
     * Get information to broadcast.
     * @return {Object}
     */
    public toBroadcastInfo() {
        const data = {
            ip: this.ip,
            port: +this.port,
            nethash: this.nethash,
            version: this.version,
            os: this.os,
            height: this.state.height,
            delay: this.delay,
        };

        if (this.config.get("network.name") !== "mainnet") {
            (data as any).hashid = this.hashid || "unknown";
        }

        return data;
    }

    /**
     * Perform POST request for a block.
     * @param  {Block}              block
     * @return {(Object|undefined)}
     */
    public async postBlock(block) {
        return this.emit("p2p.peer.postBlock", { block });
    }

    /**
     * Perform POST request for a transactions.
     * @param  {Transaction[]}      transactions
     * @return {(Object|undefined)}
     */
    public async postTransactions(transactions) {
        try {
            const response = await this.emit("p2p.peer.postTransactions", { transactions });

            return response;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Download blocks from peer.
     * @param  {Number} fromBlockHeight
     * @return {(Object[]|undefined)}
     */
    public async downloadBlocks(fromBlockHeight) {
        try {
            const response = await this.getPeerBlocks(fromBlockHeight);

            const { blocks } = response;
            const size = blocks.length;

            if (size === 100 || size === 400) {
                this.downloadSize = size;
            }

            return blocks;
        } catch (error) {
            this.logger.debug(`Cannot download blocks from peer ${this.url} because of "${error.message}"`);

            this.ban = new Date().getTime() + (Math.floor(Math.random() * 40) + 20) * 60000;

            throw error;
        }
    }

    /**
     * Perform ping request on this peer if it has not been
     * recently pinged.
     * @param  {Number} timeoutMsec operation timeout, in milliseconds
     * @param  {Boolean} force
     * @return {Object}
     * @throws {Error} If fail to get peer status.
     */
    public async ping(timeoutMsec, force = false) {
        const deadline = new Date().getTime() + timeoutMsec;
        if (this.recentlyPinged() && !force) {
            return;
        }

        const body: any = await this.emit("p2p.peer.getStatus", null, timeoutMsec);

        if (!body) {
            throw new Error(`Peer ${this.ip}: could not get status response`);
        }

        if (!body.success) {
            throw new PeerStatusResponseError(JSON.stringify(body));
        }

        if (process.env.CORE_SKIP_PEER_STATE_VERIFICATION !== "true") {
            const peerVerifier = new PeerVerifier(this);

            if (deadline <= new Date().getTime()) {
                throw new PeerPingTimeoutError(timeoutMsec);
            }

            this.verification = await peerVerifier.checkState(body, deadline);
            if (this.verification === null) {
                throw new PeerVerificationFailedError();
            }
        }

        this.lastPinged = dato();
        this.state = body;
        return body;
    }

    /**
     * Returns true if this peer was pinged the past 2 minutes.
     * @return {Boolean}
     */
    public recentlyPinged() {
        return !!this.lastPinged && dato().diffInMinutes(this.lastPinged) < 2;
    }

    /**
     * Refresh peer list. It removes blacklisted peers from the fetch
     * @return {Object[]}
     */
    public async getPeers() {
        this.logger.info(`Fetching a fresh peer list from ${this.url}`);

        const body: any = await this.emit("p2p.peer.getPeers", null);

        if (!body) {
            return [];
        }

        if (!body) {
            return [];
        }

        const blacklisted = {};
        localConfig.get("blacklist", []).forEach(ipaddr => (blacklisted[ipaddr] = true));
        return body.peers.filter(peer => !blacklisted[peer.ip]);
    }

    /**
     * Check if peer has common blocks.
     * @param  {[]String} ids
     * @param {Number} timeoutMsec timeout for the operation, in milliseconds
     * @return {Boolean}
     */
    public async hasCommonBlocks(ids, timeoutMsec?: number) {
        const errorMessage = `Could not determine common blocks with ${this.ip}`;
        try {
            const body: any = await this.emit("p2p.peer.getCommonBlocks", { ids }, timeoutMsec);

            if (!body) {
                return false;
            }

            if (!body.success) {
                const bodyStr = util.inspect(body, { depth: 2 });
                this.logger.error(`${errorMessage}: unsuccessful response: ${bodyStr}`);
                return false;
            }

            if (!body.common) {
                return false;
            }

            return body.common;
        } catch (error) {
            const sfx = timeoutMsec !== undefined ? ` within ${timeoutMsec} ms` : "";
            this.logger.error(`Could not determine common blocks with ${this.ip}${sfx}: ${error.message}`);
        }

        return false;
    }

    /**
     * Parse headers from response.
     * @param  {Object} response
     * @return {Object}
     */
    public __parseHeaders(response) {
        ["nethash", "os", "version", "hashid"].forEach(key => {
            this[key] = response.headers[key] || this[key];
        });

        if (response.headers.height) {
            this.state.height = +response.headers.height;
        }

        return response;
    }

    /**
     * GET /peer/blocks and return the raw response.
     * The API is such that the response is supposed to contain blocks at height
     * afterBlockHeight + 1, afterBlockHeight + 2, and so on up to some limit determined by the peer.
     * @param  {Number} afterBlockHeight
     * @return {(Object[]|undefined)}
     */
    public async getPeerBlocks(afterBlockHeight: number): Promise<any> {
        const response: any = this.emit("p2p.peer.getBlocks", {
            lastBlockHeight: afterBlockHeight,
            headers: this.headers,
            timeout: 10000,
        });

        /*
        // TODO adapt validateReply to sockets
        if (!this.validateReply(response, endpoint)) {
            throw new Error("Invalid reply to request for blocks");
        }*/

        return response;
    }

    /**
     * Validate a reply from the peer according to a predefined JSON schema rules.
     * @param {Object} reply peer's reply
     * @param {String} endpoint the path in the URL for which we got the reply, e.g. /peer/status
     * @return {Boolean} true if validated successfully
     */
    private validateReply(reply: any, endpoint: string): boolean {
        let schema = replySchemas[endpoint];
        if (schema === undefined) {
            // See if any of the keys in replySchemas is a prefix of endpoint and pick the longest one.
            let len = 0;
            const definedEndpoints = Object.keys(replySchemas);
            for (const d of definedEndpoints) {
                if (endpoint.startsWith(d) && len < d.length) {
                    schema = replySchemas[d];
                    len = d.length;
                }
            }

            if (schema === undefined) {
                this.logger.error(
                    `Can't validate reply from "${endpoint}": none of the predefined ` +
                        `schemas matches: ` +
                        JSON.stringify(definedEndpoints),
                );
                return false;
            }
        }

        const result = Joi.validate(reply, schema, { allowUnknown: true, convert: false });

        if (result.error) {
            let errorMessage = result.error.message;
            if (result.error.details && result.error.details.length > 0) {
                const context = result.error.details[0].context;
                errorMessage += ` - ${context.key}: ${context.value}`;
            }

            this.logger.error(`Got unexpected reply from ${this.url}${endpoint}: ${errorMessage}`);
            return false;
        }

        return true;
    }

    /*
     * Emit the event to the socket, with the data provided
     * Does not throw : handles the potential errors and returns the response or undefined.
     * @param  {string} event
     * @param  {any} data
     * @param  {number|undefined} timeout
     * @return {(Object[]|undefined)}
     */
    private async emit(event: string, data: any, timeout?: number) {
        let response;
        try {
            this.socketError = null; // reset socket error between each call
            const timeBeforeSocketCall = new Date().getTime();

            this.updateHeaders();

            // TODO we log into error right now to have it in separate log, this needs to be deleted after dev
            this.logger.error(`[peer] Sending ${event} message to ${this.ip}`);

            response = await socketEmit(this.socket, event, data, this.headers, timeout);

            this.delay = new Date().getTime() - timeBeforeSocketCall;
            this.__parseHeaders(response);
        } catch (e) {
            this.handleSocketError(e);
        }

        return response.data;
    }

    /*
     * Updates the headers to be sent : to call before each socket call.
     * Right now only this.headers.height needs to be updated.
     * @return {undefined}
     */
    private updateHeaders() {
        const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");
        if (blockchain) {
            const lastBlock = blockchain.getLastBlock();
            if (lastBlock) {
                this.headers.height = lastBlock.data.height;
            }
        }
    }

    private handleSocketError(error) {
        if (!error.name) {
            return;
        }
        // guard will then be able to determine offence / punishment based on socketError
        this.socketError = error.name;

        switch (error.name) {
            case "TimeoutError": // socketcluster timeout error
            case SocketErrors.Timeout:
                this.delay = -1;
                guard.suspend(this);
                break;
            default:
                guard.suspend(this);
        }
    }
}
