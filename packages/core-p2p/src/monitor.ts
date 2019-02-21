/* tslint:disable:max-line-length */

import { app } from "@arkecosystem/core-container";
import { Blockchain, Database, EventEmitter, Logger, P2P } from "@arkecosystem/core-interfaces";
import { slots } from "@arkecosystem/crypto";
import dayjs from "dayjs-ext";
import delay from "delay";
import fs from "fs";
import flatten from "lodash/flatten";
import groupBy from "lodash/groupBy";
import sample from "lodash/sample";
import shuffle from "lodash/shuffle";
import take from "lodash/take";
import pluralize from "pluralize";
import prettyMs from "pretty-ms";

import { config as localConfig } from "./config";
import { guard, Guard } from "./court";
import { NetworkState } from "./network-state";
import { Peer } from "./peer";

import { checkDNS, checkNTP, isValidPeer, restorePeers } from "./utils";

let config;
let logger: Logger.ILogger;
let emitter: EventEmitter.EventEmitter;

export class Monitor implements P2P.IMonitor {
    public peers: { [ip: string]: any };
    public server: any;
    public guard: Guard;
    public config: any;
    public nextUpdateNetworkStatusScheduled: boolean;
    private initializing: boolean;
    private pendingPeers: { [ip: string]: any };
    private coldStartPeriod: dayjs.Dayjs;

    /**
     * @constructor
     * @throws {Error} If no seed peers
     */
    constructor() {
        this.peers = {};
        this.coldStartPeriod = dayjs().add(localConfig.get("coldStart"), "second");
        this.initializing = true;

        // Holds temporary peers which are in the process of being accepted. Prevents that
        // peers who are not accepted yet, but send multiple requests in a short timeframe will
        // get processed multiple times in `acceptNewPeer`.
        this.pendingPeers = {};
    }

    /**
     * Method to run on startup.
     * @param {Object} options
     */
    public async start(options) {
        this.config = options;

        config = app.getConfig();
        logger = app.resolvePlugin<Logger.ILogger>("logger");
        emitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

        await this.__checkDNSConnectivity(options.dns);
        await this.__checkNTPConnectivity(options.ntp);

        this.guard = guard.init(this);

        const cachedPeers = restorePeers();
        localConfig.set("peers", cachedPeers);

        await this.populateSeedPeers();

        if (this.config.skipDiscovery) {
            logger.warn("Skipped peer discovery because the relay is in skip-discovery mode.");
        } else {
            await this.updateNetworkStatus(options.networkStart);

            for (const [version, peers] of Object.entries(groupBy(this.peers, "version"))) {
                logger.info(`Discovered ${pluralize("peer", peers.length, true)} with v${version}.`);
            }

            if (config.get("network.name") !== "mainnet") {
                for (const [hashid, peers] of Object.entries(groupBy(this.peers, "hashid"))) {
                    logger.info(`Discovered ${pluralize("peer", peers.length, true)} on commit ${hashid}.`);
                }
            }
        }

        this.initializing = false;
        return this;
    }

    /**
     * Update network status (currently only peers are updated).
     * @param  {Boolean} networkStart
     * @return {Promise}
     */
    public async updateNetworkStatus(networkStart: boolean = false) {
        if (process.env.CORE_ENV === "test" || process.env.NODE_ENV === "test") {
            return;
        }

        if (networkStart) {
            logger.warn("Skipped peer discovery because the relay is in genesis-start mode.");
            return;
        }

        if (this.config.disableDiscovery) {
            logger.warn("Skipped peer discovery because the relay is in non-discovery mode.");
            return;
        }

        try {
            await this.discoverPeers();
            await this.cleanPeers();
        } catch (error) {
            logger.error(`Network Status: ${error.message}`);
        }

        let nextRunDelaySeconds = 600;

        if (!this.hasMinimumPeers()) {
            await this.populateSeedPeers();
            nextRunDelaySeconds = 5;
            logger.info(`Couldn't find enough peers. Falling back to seed peers.`);
        }

        this.scheduleUpdateNetworkStatus(nextRunDelaySeconds);
    }

    /**
     * Accept and store a valid peer.
     * @param  {Peer} peer
     * @throws {Error} If invalid peer
     */
    public async acceptNewPeer(peer, seed?: boolean) {
        if (this.config.disableDiscovery && !this.pendingPeers[peer.ip]) {
            logger.warn(`Rejected ${peer.ip} because the relay is in non-discovery mode.`);
            return;
        }

        if (!isValidPeer(peer) || this.guard.isSuspended(peer) || this.pendingPeers[peer.ip]) {
            return;
        }

        const newPeer = new Peer(peer.ip, peer.port);
        newPeer.setHeaders(peer);

        if (this.guard.isBlacklisted(peer)) {
            logger.debug(`Rejected peer ${peer.ip} as it is blacklisted`);

            return this.guard.suspend(newPeer);
        }

        if (!this.guard.isValidVersion(peer) && !this.guard.isWhitelisted(peer)) {
            const minimumVersions: string[] = localConfig.get("minimumVersions");

            logger.debug(
                `Rejected peer ${
                    peer.ip
                } as it doesn't meet the minimum version requirements. Expected: ${minimumVersions} - Received: ${
                    peer.version
                }`,
            );

            return this.guard.suspend(newPeer);
        }

        if (!this.guard.isValidNetwork(peer) && !seed) {
            logger.debug(
                `Rejected peer ${peer.ip} as it isn't on the same network. Expected: ${config.get(
                    "network.nethash",
                )} - Received: ${peer.nethash}`,
            );

            return this.guard.suspend(newPeer);
        }

        if (this.getPeer(peer.ip)) {
            return;
        }

        try {
            this.pendingPeers[peer.ip] = true;

            await newPeer.ping(3000);

            this.peers[peer.ip] = newPeer;

            logger.debug(`Accepted new peer ${newPeer.ip}:${newPeer.port}`);

            emitter.emit("peer.added", newPeer);
        } catch (error) {
            logger.debug(`Could not accept new peer ${newPeer.ip}:${newPeer.port}: ${error}`);

            this.guard.suspend(newPeer);
        } finally {
            delete this.pendingPeers[peer.ip];
        }
    }

    /**
     * Remove peer from monitor.
     * @param {Peer} peer
     */
    public removePeer(peer) {
        delete this.peers[peer.ip];
    }

    /**
     * Clear peers which aren't responding.
     * @param {Boolean} fast
     * @param {Boolean} tracker
     * @param {Boolean} forcePing
     */
    public async cleanPeers(fast = false, forcePing = false) {
        const keys = Object.keys(this.peers);
        let unresponsivePeers = 0;
        const pingDelay = fast ? 1500 : localConfig.get("globalTimeout");
        const max = keys.length;

        logger.info(`Checking ${max} peers :telescope:`);
        const peerErrors = {};
        await Promise.all(
            keys.map(async ip => {
                const peer = this.getPeer(ip);
                try {
                    await peer.ping(pingDelay, forcePing);
                } catch (error) {
                    unresponsivePeers++;

                    if (peerErrors[error]) {
                        peerErrors[error].push(peer);
                    } else {
                        peerErrors[error] = [peer];
                    }

                    emitter.emit("peer.removed", peer);

                    this.removePeer(peer);

                    return null;
                }
            }),
        );

        Object.keys(peerErrors).forEach((key: any) => {
            const peerCount = peerErrors[key].length;
            logger.debug(`Removed ${peerCount} ${pluralize("peers", peerCount)} because of "${key}"`);
        });

        if (this.initializing) {
            logger.info(`${max - unresponsivePeers} of ${max} peers on the network are responsive`);
            logger.info(`Median Network Height: ${this.getNetworkHeight().toLocaleString()}`);
            logger.info(`Network PBFT status: ${this.getPBFTForgingStatus()}`);
        }
    }

    /**
     * Suspend an existing peer.
     * @param  {Peer} peer
     * @return {void}
     */
    public suspendPeer(ip) {
        const peer = this.peers[ip];

        if (peer && !this.guard.isSuspended(peer)) {
            this.guard.suspend(peer);
        }
    }

    /**
     * Get a list of all suspended peers.
     * @return {void}
     */
    public getSuspendedPeers() {
        return this.guard.all();
    }

    /**
     * Get all available peers.
     * @return {Peer[]}
     */
    public getPeers() {
        return Object.values(this.peers) as Peer[];
    }

    /**
     * Get the peer available peers.
     * @param  {String} ip
     * @return {Peer}
     */
    public getPeer(ip) {
        return this.peers[ip];
    }

    public async peerHasCommonBlocks(peer, blockIds) {
        if (await peer.hasCommonBlocks(blockIds)) {
            return true;
        }

        peer.commonBlocks = false;

        this.guard.suspend(peer);

        return false;
    }

    /**
     * Get a random, available peer.
     * @param  {(Number|undefined)} acceptableDelay
     * @return {Peer}
     */
    public getRandomPeer(acceptableDelay?, downloadSize?, failedAttempts?) {
        failedAttempts = failedAttempts === undefined ? 0 : failedAttempts;

        const peersAll = this.getPeers();

        const peersFiltered = peersAll.filter(peer => {
            if (peer.ban < new Date().getTime()) {
                return true;
            }

            if (acceptableDelay && peer.delay < acceptableDelay) {
                return true;
            }

            if (downloadSize && peer.downloadSize !== downloadSize) {
                return true;
            }

            return false;
        });

        const randomPeer = sample(peersFiltered);
        if (!randomPeer) {
            failedAttempts++;

            if (failedAttempts > 10) {
                throw new Error(
                    `Failed to pick a random peer from our list of ${peersAll.length} peers ` +
                        `(${peersFiltered.length} after filtering)`,
                );
            } else if (failedAttempts > 5) {
                return this.getRandomPeer(null, downloadSize, failedAttempts);
            }

            return this.getRandomPeer(acceptableDelay, downloadSize, failedAttempts);
        }

        return randomPeer;
    }

    /**
     * Populate list of available peers from random peers.
     */
    public async discoverPeers() {
        const shuffledPeers = shuffle(this.getPeers());

        for (const peer of shuffledPeers) {
            try {
                const hisPeers = await peer.getPeers();
                await Promise.all(hisPeers.map(p => this.acceptNewPeer(p)));
            } catch (error) {
                // Just try with the next peer from shuffledPeers.
            }

            if (this.hasMinimumPeers()) {
                return;
            }
        }
    }

    /**
     * Check if we have any peers.
     * @return {bool}
     */
    public hasPeers() {
        return !!this.getPeers().length;
    }

    /**
     * Get the median network height.
     * @return {Number}
     */
    public getNetworkHeight() {
        const medians = this.getPeers()
            .filter(peer => peer.state.height)
            .map(peer => peer.state.height)
            .sort();

        return medians[Math.floor(medians.length / 2)] || 0;
    }

    /**
     * Get the PBFT Forging status.
     * @return {Number}
     */
    public getPBFTForgingStatus() {
        const height = this.getNetworkHeight();
        const slot = slots.getSlotNumber();

        let allowedToForge = 0;
        let syncedPeers = 0;

        for (const peer of this.getPeers()) {
            if (peer.state) {
                if (peer.state.currentSlot === slot) {
                    syncedPeers++;

                    if (peer.state.forgingAllowed && peer.state.height >= height) {
                        allowedToForge++;
                    }
                }
            }
        }

        const pbft = allowedToForge / syncedPeers;

        return isNaN(pbft) ? 0 : pbft;
    }

    public async getNetworkState(): Promise<NetworkState> {
        if (!this.__isColdStartActive()) {
            await this.cleanPeers(true, true);
        }

        return NetworkState.analyze(this);
    }

    /**
     * Refresh all peers after a fork. Peers with no common blocks are
     * suspended.
     * @return {void}
     */
    public async refreshPeersAfterFork() {
        logger.info(`Refreshing ${this.getPeers().length} peers after fork.`);

        // Reset all peers, except peers banned because of causing a fork.
        await this.guard.resetSuspendedPeers();

        // Ban peer who caused the fork
        const forkedBlock = app.resolve("state").forkedBlock;
        if (forkedBlock) {
            this.suspendPeer(forkedBlock.ip);
        }
    }

    /**
     * Download blocks from a random peer.
     * @param  {Number}   fromBlockHeight
     * @return {Object[]}
     */
    public async downloadBlocks(fromBlockHeight) {
        let randomPeer;

        try {
            randomPeer = await this.getRandomPeer();
        } catch (error) {
            logger.error(`Could not download blocks: ${error.message}`);

            return [];
        }
        try {
            logger.info(`Downloading blocks from height ${fromBlockHeight.toLocaleString()} via ${randomPeer.ip}`);

            const blocks = await randomPeer.downloadBlocks(fromBlockHeight);
            blocks.forEach(block => {
                block.ip = randomPeer.ip;
            });

            return blocks;
        } catch (error) {
            logger.error(`Could not download blocks: ${error.message}`);

            return this.downloadBlocks(fromBlockHeight);
        }
    }

    /**
     * Broadcast block to all peers.
     * @param  {Block}   block
     * @return {Promise}
     */
    public async broadcastBlock(block) {
        const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

        if (!blockchain) {
            logger.info(`Skipping broadcast of block ${block.data.height.toLocaleString()} as blockchain is not ready`);
            return;
        }

        let blockPing = blockchain.getBlockPing();
        let peers = this.getPeers();

        if (blockPing && blockPing.block.id === block.data.id) {
            // wait a bit before broadcasting if a bit early
            const diff = blockPing.last - blockPing.first;
            const maxHop = 4;
            let proba = (maxHop - blockPing.count) / maxHop;

            if (diff < 500 && proba > 0) {
                await delay(500 - diff);

                blockPing = blockchain.getBlockPing();

                // got aleady a new block, no broadcast
                if (blockPing.block.id !== block.data.id) {
                    return;
                }

                proba = (maxHop - blockPing.count) / maxHop;
            }

            // TODO: to be put in config?
            peers = peers.filter(p => Math.random() < proba);
        }

        logger.info(
            `Broadcasting block ${block.data.height.toLocaleString()} to ${pluralize("peer", peers.length, true)}`,
        );

        await Promise.all(peers.map(peer => peer.postBlock(block.toJson())));
    }

    /**
     * Broadcast transactions to a fixed number of random peers.
     * @param {Transaction[]} transactions
     */
    public async broadcastTransactions(transactions) {
        const peers = take(shuffle(this.getPeers()), localConfig.get("maxPeersBroadcast"));

        logger.debug(
            `Broadcasting ${pluralize("transaction", transactions.length, true)} to ${pluralize(
                "peer",
                peers.length,
                true,
            )}`,
        );

        transactions = transactions.map(tx => tx.toJson());
        return Promise.all(peers.map(peer => peer.postTransactions(transactions)));
    }

    /**
     * Update all peers based on height and last block id.
     *
     * Grouping peers by height and then by common id results in one of the following
     * scenarios:
     *
     *  1) Same height, same common id
     *  2) Same height, mixed common id
     *  3) Mixed height, same common id
     *  4) Mixed height, mixed common id
     *
     * Scenario 1: Do nothing.
     * Scenario 2-4:
     *  - If own height is ahead of majority do nothing for now.
     *  - Pick most common id from peers with most common height and calculate quota,
     *    depending on which the node rolls back or waits.
     *
     * NOTE: Only called when the network is consecutively missing blocks `p2pUpdateCounter` times.
     * @return {String}
     */
    public async updatePeersOnMissingBlocks() {
        // First ping all peers to get updated heights and remove unresponsive ones.
        if (!this.__isColdStartActive()) {
            await this.cleanPeers(true);
        }

        const lastBlock = app.resolve("state").getLastBlock();

        const nodes = this.getPeers();
        // Also count ourselves in the calculations below.
        nodes.push({
            me: true,
            state: {
                height: lastBlock.data.height,
                header: {
                    id: lastBlock.data.id,
                },
            },
        });

        const peersGroupedByHeight = groupBy(nodes, "state.height");
        const commonHeightGroups = Object.values(peersGroupedByHeight).sort((a, b) => b.length - a.length);
        const peersMostCommonHeight = commonHeightGroups[0];
        const groupedByCommonId = groupBy(peersMostCommonHeight, "state.header.id");
        const commonIdGroupCount = Object.keys(groupedByCommonId).length;
        let state = "";

        if (commonHeightGroups.length === 1 && commonIdGroupCount === 1) {
            // No need to do anything.
            return state;
        }

        // Do nothing if majority of peers are lagging behind
        if (commonHeightGroups.length > 1) {
            if (lastBlock.data.height > peersMostCommonHeight[0].state.height) {
                logger.info(
                    `${pluralize(
                        "peer",
                        peersMostCommonHeight.length,
                        true,
                    )} are at height ${peersMostCommonHeight[0].state.height.toLocaleString()} and lagging behind last height ${lastBlock.data.height.toLocaleString()}. :zzz:`,
                );
                return state;
            }
        }

        // Sort common id groups by length DESC
        const commonIdGroups = Object.values(groupedByCommonId).sort((a, b) => b.length - a.length);

        // Peers are sitting on the same height, but there might not be enough
        // quorum to move on, because of different last blocks.
        if (commonIdGroupCount > 1 || lastBlock.data.id !== peersMostCommonHeight[0].state.header.id) {
            const chosenPeers = commonIdGroups[0];
            const restGroups = commonIdGroups.slice(1);

            if (restGroups.some(group => group.length === chosenPeers.length)) {
                logger.warn("Peers are evenly split at same height with different block ids. :zap:");
            }

            if (commonIdGroupCount > 1) {
                logger.info(
                    `Detected peers at the same height ${peersMostCommonHeight[0].state.height.toLocaleString()} with different block ids: ${JSON.stringify(
                        Object.keys(groupedByCommonId).map(k => `${k}: ${groupedByCommonId[k].length}`),
                        null,
                        4,
                    )}`,
                );
            }

            // XXX We don't have enough information here whether to rollback or not.
            // If our last block height and id differ from chosenPeers[0].state.height and
            // chosenPeers[0].state.header.id, then we do not know which one is true:
            // 1. we are on a different chain (fork), we need to rollback,
            // 2. we are just lagging behind the chosenPeers[] group (same chain), we need to download blocks
            // 3. we are ahead of the chosenPeers[] group (same chain), they need to download blocks from us

            const badLastBlock =
                chosenPeers[0].state.height === lastBlock.data.height &&
                chosenPeers[0].state.header.id !== lastBlock.data.id;
            const quota = chosenPeers.length / flatten(commonIdGroups).length;
            if (quota < 0.66) {
                // or quota too low TODO: find better number
                logger.info(`Common id quota '${quota}' is too low. Going to rollback. :repeat:`);
                state = "rollback";
            } else if (badLastBlock) {
                // Rollback if last block is bad and quota high
                logger.info(
                    `Last block id ${lastBlock.data.id} is bad, ` +
                        `but got enough common id quota: ${quota}. Going to rollback. :repeat:`,
                );
                state = "rollback";
            }

            if (state === "rollback") {
                // Ban all rest peers
                const peersToBan = flatten(restGroups).filter(peer => !peer.me);
                peersToBan.forEach(peer => {
                    (peer as any).commonId = false;
                    this.suspendPeer(peer.ip);
                });

                logger.debug(
                    `Banned ${pluralize(
                        "peer",
                        peersToBan.length,
                        true,
                    )} at height '${peersMostCommonHeight[0].state.height.toLocaleString()}' which do not have common id '${
                        chosenPeers[0].state.header.id
                    }'.`,
                );
            }
        } else {
            // Under certain circumstances the headers can be missing (i.e. seed peers when starting up)
            const commonHeader = peersMostCommonHeight[0].state.header;
            logger.info(
                `All peers at most common height ${peersMostCommonHeight[0].state.height.toLocaleString()} share the same block id${
                    commonHeader ? ` '${commonHeader.id}'` : ""
                }. :pray:`,
            );
        }

        return state;
    }

    /**
     * Dump the list of active peers.
     * @return {void}
     */
    public dumpPeers() {
        const peers = Object.values(this.peers).map(peer => ({
            ip: peer.ip,
            port: peer.port,
            version: peer.version,
        }));

        try {
            fs.writeFileSync(`${process.env.CORE_PATH_CACHE}/peers.json`, JSON.stringify(peers, null, 2));
        } catch (err) {
            logger.error(`Failed to dump the peer list because of "${err.message}"`);
        }
    }

    /**
     * Get last 10 block IDs from database.
     * @return {[]String}
     */
    public async __getRecentBlockIds() {
        return app.resolvePlugin<Database.IDatabaseService>("database").getRecentBlockIds();
    }

    /**
     * Determines if coldstart is still active.
     * We need this for the network to start, so we dont forge, while
     * not all peers are up, or the network is not active
     */
    public __isColdStartActive() {
        return this.coldStartPeriod.isAfter(dayjs());
    }

    /**
     * Check if the node can connect to any DNS host.
     * @return {void}
     */
    public async __checkDNSConnectivity(options) {
        try {
            const host = await checkDNS(options);

            logger.info(`Your network connectivity has been verified by ${host}`);
        } catch (error) {
            logger.error(error.message);
        }
    }

    /**
     * Check if the node can connect to any NTP host.
     * @return {void}
     */
    public async __checkNTPConnectivity(options) {
        try {
            const { host, time } = await checkNTP(options);

            logger.info(`Your NTP connectivity has been verified by ${host}`);

            logger.info(
                `Local clock is off by ${time.t < 0 ? "-" : ""}${prettyMs(Math.abs(time.t))} from NTP :alarm_clock:`,
            );
        } catch (error) {
            logger.error(error.message);
        }
    }

    /**
     * Schedule the next update network status.
     * @param {Number} nextUpdateInSeconds
     * @returns {void}
     */
    private async scheduleUpdateNetworkStatus(nextUpdateInSeconds) {
        if (this.nextUpdateNetworkStatusScheduled) {
            return;
        }

        this.nextUpdateNetworkStatusScheduled = true;

        await delay(nextUpdateInSeconds * 1000);

        this.nextUpdateNetworkStatusScheduled = false;

        this.updateNetworkStatus(this.config.networkStart);
    }

    /**
     * Returns if the minimum amount of peers are available.
     * @return {Boolean}
     */
    private hasMinimumPeers() {
        if (this.config.ignoreMinimumNetworkReach) {
            logger.warn("Ignored the minimum network reach because the relay is in seed mode.");

            return true;
        }

        return Object.keys(this.peers).length >= localConfig.get("minimumNetworkReach");
    }

    /**
     * Populate the initial seed list.
     * @return {void}
     */
    private async populateSeedPeers() {
        const peerList = config.get("peers.list");

        if (!peerList) {
            app.forceExit("No seed peers defined in peers.json :interrobang:");
        }

        let peers = peerList.map(peer => {
            peer.version = app.getVersion();
            return peer;
        });

        if (localConfig.get("peers")) {
            peers = { ...peers, ...localConfig.get("peers") };
        }

        return Promise.all(
            Object.values(peers).map((peer: any) => {
                delete this.guard.suspensions[peer.ip];
                return this.acceptNewPeer(peer, true);
            }),
        );
    }
}

export const monitor = new Monitor();
