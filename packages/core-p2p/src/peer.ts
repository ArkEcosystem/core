import { app } from "@arkecosystem/core-container";
import { Logger, P2P } from "@arkecosystem/core-interfaces";
import axios from "axios";
import dayjs from "dayjs-ext";
import Joi from "joi";
import util from "util";
import { config as localConfig } from "./config";
import { PeerPingTimeoutError, PeerStatusResponseError, PeerVerificationFailedError } from "./errors";
import { PeerVerificationResult, PeerVerifier } from "./peer-verifier";

export class Peer implements P2P.IPeer {
    private static replySchemas: any = {
        "/peer/blocks": Joi.object().keys({
            blocks: Joi.array()
                .items(
                    Joi.object().keys({
                        height: Joi.number()
                            .integer()
                            .min(1)
                            .required(),
                        id: Joi.string()
                            .max(64)
                            .hex()
                            .required(),
                    }),
                )
                .required(),
        }),
        "/peer/blocks/common?ids=": Joi.object()
            .keys({
                common: Joi.object()
                    .keys({
                        height: Joi.number()
                            .integer()
                            .min(1)
                            .required(),
                        id: Joi.string()
                            .max(64)
                            .hex()
                            .required(),
                    })
                    .required(),
                success: Joi.boolean()
                    .equal(true)
                    .required(),
            })
            .required(),
        "/peer/list": Joi.object()
            .keys({
                peers: Joi.array()
                    .items(
                        Joi.object().keys({
                            ip: Joi.string()
                                .ip({ cidr: "forbidden" })
                                .required(),
                            status: [Joi.string(), Joi.number().integer()],
                        }),
                    )
                    .required(),
                success: Joi.boolean()
                    .equal(true)
                    .required(),
            })
            .required(),
        "/peer/status": Joi.object()
            .keys({
                header: Joi.object()
                    .keys({
                        height: Joi.number()
                            .integer()
                            .min(1)
                            .required(),
                        id: Joi.string()
                            .max(64)
                            .hex()
                            .required(),
                    })
                    .required(),
                height: Joi.number()
                    .integer()
                    .min(1),
                success: Joi.boolean()
                    .equal(true)
                    .required(),
            })
            .required(),
    };
    public downloadSize: any;
    public hashid: string;
    public nethash: any;
    public version: any;
    public os: any;
    public status: any;
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
        status?: any;
    };

    public state: any;
    public url: string;
    public lastPinged: dayjs.Dayjs | null;
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
     * Set the given status for the peer.
     * @param  {String} value
     * @return {void}
     */
    public setStatus(value) {
        this.headers.status = value;
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
            status: this.status,
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
        return this.__post(
            "/peer/blocks",
            { block },
            {
                headers: this.headers,
                timeout: 5000,
            },
        );
    }

    /**
     * Perform POST request for a transactions.
     * @param  {Transaction[]}      transactions
     * @return {(Object|undefined)}
     */
    public async postTransactions(transactions) {
        try {
            const response = await this.__post(
                "/peer/transactions",
                {
                    transactions,
                },
                {
                    headers: this.headers,
                    timeout: 8000,
                },
            );

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

            this.__parseHeaders(response);

            const { blocks } = response.data;
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
     * @param  {Number} delay operation timeout, in milliseconds
     * @param  {Boolean} force
     * @return {Object}
     * @throws {Error} If fail to get peer status.
     */
    public async ping(delay: number, force = false) {
        const deadline = new Date().getTime() + delay;

        if (this.recentlyPinged() && !force) {
            return;
        }

        const body = await this.__get("/peer/status", delay);

        if (!body) {
            throw new Error(`Peer ${this.ip}: could not get status response`);
        }

        if (!body.success) {
            throw new PeerStatusResponseError(JSON.stringify(body));
        }

        if (process.env.CORE_SKIP_PEER_STATE_VERIFICATION !== "true") {
            const peerVerifier = new PeerVerifier(this);

            if (deadline <= new Date().getTime()) {
                throw new PeerPingTimeoutError(delay);
            }

            this.verification = await peerVerifier.checkState(body, deadline);
            if (this.verification === null) {
                throw new PeerVerificationFailedError();
            }
        }

        this.lastPinged = dayjs();
        this.state = body;
        return body;
    }

    /**
     * Returns true if this peer was pinged the past 2 minutes.
     * @return {Boolean}
     */
    public recentlyPinged() {
        return !!this.lastPinged && dayjs().diff(this.lastPinged, "minute") < 2;
    }

    /**
     * Refresh peer list. It removes blacklisted peers from the fetch
     * @return {Object[]}
     */
    public async getPeers() {
        this.logger.info(`Fetching a fresh peer list from ${this.url}`);

        const body = await this.__get("/peer/list");

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
            let url = `/peer/blocks/common?ids=${ids.join(",")}`;
            if (ids.length === 1) {
                url += ",";
            }

            const body = await this.__get(url, timeoutMsec);

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
     * Perform GET request.
     * @param  {String} endpoint
     * @param  {Number} [timeout=10000]
     * @return {(Object|undefined)}
     */
    public async __get(endpoint, timeout?) {
        const temp = new Date().getTime();

        try {
            const response = await axios.get(`${this.url}${endpoint}`, {
                headers: this.headers,
                timeout: timeout || this.config.get("peers.globalTimeout"),
            });

            this.__parseHeaders(response);

            if (!this.validateReply(response.data, endpoint)) {
                return;
            }

            this.delay = new Date().getTime() - temp;

            if (!response.data) {
                this.logger.debug(`Request to ${this.url}${endpoint} failed: empty response`);
                return;
            }

            return response.data;
        } catch (error) {
            this.delay = -1;

            this.logger.debug(`Request to ${this.url}${endpoint} failed: ${error.message}`);

            if (error.response) {
                this.__parseHeaders(error.response);
            }
        }
    }

    /**
     * Perform POST request.
     * @param  {String} endpoint
     * @param  {Object} body
     * @param  {Object} headers
     * @return {(Object|undefined)}
     */
    public async __post(endpoint, body, headers) {
        try {
            const response = await axios.post(`${this.url}${endpoint}`, body, headers);

            this.__parseHeaders(response);

            return response.data;
        } catch (error) {
            this.logger.debug(`Request to ${this.url}${endpoint} failed because of "${error.message}"`);

            if (error.response) {
                this.__parseHeaders(error.response);
            }
        }
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

        this.status = response.status;

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
        const endpoint = "/peer/blocks";
        const response = await axios.get(`${this.url}${endpoint}`, {
            params: { lastBlockHeight: afterBlockHeight },
            headers: this.headers,
            timeout: 10000,
        });

        if (!this.validateReply(response.data, endpoint)) {
            throw new Error("Invalid reply to request for blocks");
        }

        return response;
    }

    /**
     * Validate a reply from the peer according to a predefined JSON schema rules.
     * @param {Object} reply peer's reply
     * @param {String} endpoint the path in the URL for which we got the reply, e.g. /peer/status
     * @return {Boolean} true if validated successfully
     */
    private validateReply(reply: any, endpoint: string): boolean {
        let schema = Peer.replySchemas[endpoint];
        if (schema === undefined) {
            // See if any of the keys in replySchemas is a prefix of endpoint and pick the longest one.
            let len = 0;
            const definedEndpoints = Object.keys(Peer.replySchemas);
            for (const d of definedEndpoints) {
                if (endpoint.startsWith(d) && len < d.length) {
                    schema = Peer.replySchemas[d];
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
            this.logger.error(
                `Got unexpected reply from ${this.url}${endpoint}: ${JSON.stringify(reply)}: ` + result.error.message,
            );
            return false;
        }

        return true;
    }
}
