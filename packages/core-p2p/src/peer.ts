import { app } from "@arkecosystem/core-container";
import { AbstractLogger } from "@arkecosystem/core-logger";
import axios from "axios";
import dayjs from "dayjs-ext";
import util from "util";
import { config as localConfig } from "./config";

export class Peer {
    public static isOk(peer) {
        return peer.status === 200 || peer.status === "OK";
    }
    public downloadSize: any;
    public hashid: string;
    public nethash: any;
    public milestoneHash: string;
    public version: any;
    public os: any;
    public status: any;
    public delay: any;
    public ban: number;
    public offences: any[];

    private url: string;
    private state: any;
    private lastPinged: dayjs.Dayjs | null;

    private config: any;
    private logger: AbstractLogger;

    private headers: {
        version: string;
        port: number;
        nethash: number;
        milestoneHash: string;
        height: number | null;
        "Content-Type": "application/json";
        hashid?: string;
        status?: any;
    };

    /**
     * @constructor
     * @param  {String} ip
     * @param  {Number} port
     */
    constructor(readonly ip, readonly port) {
        this.logger = app.resolvePlugin<AbstractLogger>("logger");
        this.config = app.getConfig();

        this.ban = new Date().getTime();
        this.url = `${port % 443 === 0 ? "https://" : "http://"}${ip}:${port}`;
        this.state = {};
        this.offences = [];
        this.lastPinged = null;

        this.headers = {
            version: app.getVersion(),
            port: localConfig.get("port"),
            nethash: this.config.get("network.nethash"),
            milestoneHash: this.config.get("milestoneHash"),
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
        ["nethash", "milestoneHash", "os", "version"].forEach(key => {
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
            milestoneHash: this.milestoneHash,
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
            const response = await axios.get(`${this.url}/peer/blocks`, {
                params: { lastBlockHeight: fromBlockHeight },
                headers: this.headers,
                timeout: 10000,
            });

            this.__parseHeaders(response);

            const { blocks } = response.data;
            const size = blocks.length;

            if (size === 100 || size === 400) {
                this.downloadSize = size;
            }

            return blocks;
        } catch (error) {
            this.logger.debug(
                `Cannot download blocks from peer ${this.url} - ${util.inspect(error, {
                    depth: 1,
                })}`,
            );

            this.ban = new Date().getTime() + (Math.floor(Math.random() * 40) + 20) * 60000;

            throw error;
        }
    }

    /**
     * Perform ping request on this peer if it has not been
     * recently pinged.
     * @param  {Number} [delay=5000]
     * @param  {Boolean} force
     * @return {Object}
     * @throws {Error} If fail to get peer status.
     */
    public async ping(delay, force = false) {
        if (this.recentlyPinged() && !force) {
            return;
        }

        const body = await this.__get("/peer/status", delay || localConfig.get("globalTimeout"));

        if (!body) {
            throw new Error(`Peer ${this.ip} is unresponsive`);
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

        await this.ping(2000);

        const body = await this.__get("/peer/list");

        return body.peers.filter(peer => !localConfig.get("blacklist").includes(peer.ip));
    }

    /**
     * Check if peer has common blocks.
     * @param  {[]String} ids
     * @return {Boolean}
     */
    public async hasCommonBlocks(ids) {
        try {
            let url = `/peer/blocks/common?ids=${ids.join(",")}`;
            if (ids.length === 1) {
                url += ",";
            }
            const body = await this.__get(url);

            return body && body.success && body.common;
        } catch (error) {
            this.logger.error(`Could not determine common blocks with ${this.ip}: ${error}`);
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

            this.delay = new Date().getTime() - temp;

            this.__parseHeaders(response);

            return response.data;
        } catch (error) {
            this.delay = -1;

            this.logger.debug(`Request to ${this.url}${endpoint} failed because of "${error.message}"`);

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

        if (response.headers.milestonehash) {
            this.milestoneHash = response.headers.milestonehash;
        }

        if (response.headers.height) {
            this.state.height = +response.headers.height;
        }

        this.status = response.status;

        return response;
    }
}
