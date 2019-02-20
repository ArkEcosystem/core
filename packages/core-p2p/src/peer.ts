import { app } from "@arkecosystem/core-container";
import { Logger, P2P } from "@arkecosystem/core-interfaces";
import dayjs from "dayjs-ext";
import delay from "delay";
import socketCluster from "socketcluster-client";
import util from "util";
import { config as localConfig } from "./config";
import { guard } from "./court";
import { PeerVerifier } from "./peer-verifier";
import { SocketErrors } from "./socket-server/constants";

export class Peer implements P2P.IPeer {
    public downloadSize: any;
    public hashid: string;
    public nethash: any;
    public milestoneHash: string;
    public version: any;
    public os: any;
    public delay: any;
    public ban: number;
    public offences: any[];

    public headers: {
        version: string;
        port: number;
        nethash: number;
        milestoneHash: string;
        height: number | null;
        "Content-Type": "application/json";
        hashid?: string;
    };

    public socket;
    public socketError: string | null;

    public state: any;
    public url: string;
    public lastPinged: dayjs.Dayjs | null;

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
        ["nethash", "milestoneHash", "os", "version"].forEach(key => {
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
            milestoneHash: this.milestoneHash,
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

            this.__parseHeaders(response);

            const { blocks } = response;
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
            throw new Error(`Peer ${this.ip} is unresponsive`);
        }

        if (!body.success) {
            throw new Error(
                `Erroneous response from peer ${this.ip} when trying to retrieve its status: ` + JSON.stringify(body),
            );
        }

        if (process.env.CORE_SKIP_PEER_STATE_VERIFICATION !== "true") {
            const peerVerifier = new PeerVerifier(this);

            if (deadline <= new Date().getTime()) {
                throw new Error(
                    `When pinging peer ${this.ip}: ping timeout (${delay} ms) elapsed ` +
                        `even before starting peer verification`,
                );
            }

            if (!(await peerVerifier.checkState(body, deadline))) {
                throw new Error(
                    `Peer state verification failed for peer ${this.ip}, claimed state: ` + JSON.stringify(body),
                );
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

        await this.ping(2000);

        const body: any = await this.emit("p2p.peer.getPeers", null);

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
        try {
            const body: any = await this.emit("p2p.peer.getCommonBlocks", { ids }, timeoutMsec);

            return body && body.success && body.common;
        } catch (error) {
            const sfx = timeoutMsec !== undefined ? ` within ${timeoutMsec} ms` : "";
            this.logger.error(`Could not determine common blocks with ${this.ip}${sfx}: ${error}`);
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

        if (response.headers.milestonehash) {
            this.milestoneHash = response.headers.milestonehash;
        }

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
        return this.emit("p2p.peer.getBlocks", {
            lastBlockHeight: afterBlockHeight,
            headers: this.headers,
            timeout: 10000,
        });
    }

    /*
     * Emit the event to the socket, with the data provided
     * Does not throw : handles the potential errors and returns the response or undefined.
     * @param  {string} event
     * @param  {any} data
     * @param  {number|undefined} timeout
     * @return {(Object[]|undefined)}
     */
    private async emit(event: string, data: any = {}, timeout?: number) {
        data.headers = this.headers;

        this.logger.debug(`Sending socket message "${event}" to ${this.ip} : ${JSON.stringify(data, null, 2)}`);

        // if socket is not connected, we give it 1 second
        for (let i = 0; i < 10 && this.socket.getState() !== this.socket.OPEN; i++) {
            await delay(100);
        }
        if (this.socket.getState() !== this.socket.OPEN) {
            this.logger.error(`Peer ${this.ip} socket is not connected. State: ${this.socket.getState()}`);
            guard.suspend(this);
            return;
        }

        const socketEmitPromise = new Promise((resolve, reject) => {
            this.socket.emit(event, data, (err, val) => (err ? reject(err) : resolve(val)));
        });
        const timeoutPromise = new Promise((resolve, reject) => {
            const id = setTimeout(() => {
                clearTimeout(id);
                reject(`Socket emit "${event}" : timed out (${timeout}ms)`);
            }, timeout);
        });

        let response;
        try {
            this.socketError = null; // reset socket error between each call
            const timeBeforeSocketCall = new Date().getTime();

            response = timeout ? await Promise.race([socketEmitPromise, timeoutPromise]) : await socketEmitPromise;

            this.delay = new Date().getTime() - timeBeforeSocketCall;
            this.__parseHeaders(response);
        } catch (e) {
            this.handleSocketError(e);
        }

        return response;
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
