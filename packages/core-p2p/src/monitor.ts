/* tslint:disable:max-line-length */

import { app } from "@arkecosystem/core-container";
import { Blockchain, Database, EventEmitter, Logger, P2P } from "@arkecosystem/core-interfaces";
import { slots } from "@arkecosystem/crypto";
import { dato, Dato } from "@faustbrian/dato";
import delay from "delay";
import fs from "fs";
import groupBy from "lodash.groupby";
import sample from "lodash.sample";
import shuffle from "lodash.shuffle";
import take from "lodash.take";
import pluralize from "pluralize";
import prettyMs from "pretty-ms";
import { PeerStatusResponseError } from "./errors";
import { guard, Guard } from "./guard";
import { IAcceptNewPeerOptions } from "./interfaces";
import { NetworkState } from "./network-state";
import { Peer } from "./peer";
import { checkDNS, checkNTP, isValidPeer, restorePeers } from "./utils";

export class Monitor implements P2P.IMonitor {
    public peers: { [ip: string]: any };
    public server: any;
    public guard: Guard;
    public config: any;
    public nextUpdateNetworkStatusScheduled: boolean;
    private initializing: boolean;
    private pendingPeers: { [ip: string]: any };
    private coldStartPeriod: Dato;

    private readonly appConfig = app.getConfig();
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    private readonly emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

    /**
     * @constructor
     * @throws {Error} If no seed peers
     */
    constructor() {
        this.peers = {};
        this.coldStartPeriod = dato().addSeconds(app.resolveOptions("p2p").coldStart);
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
    public async start(options): Promise<this> {
        this.config = options;

        await this.__checkDNSConnectivity(options.dns);
        await this.__checkNTPConnectivity(options.ntp);

        this.guard = guard.init(this);

        restorePeers();
        // localConfig.set("peers", cachedPeers);

        await this.populateSeedPeers();

        if (this.config.skipDiscovery) {
            this.logger.warn("Skipped peer discovery because the relay is in skip-discovery mode.");
        } else {
            await this.updateNetworkStatus(options.networkStart);

            for (const [version, peers] of Object.entries(groupBy(this.peers, "version"))) {
                this.logger.info(`Discovered ${pluralize("peer", peers.length, true)} with v${version}.`);
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
    public async updateNetworkStatus(networkStart: boolean = false): Promise<void> {
        if (process.env.CORE_ENV === "test" || process.env.NODE_ENV === "test") {
            return;
        }

        if (networkStart) {
            this.logger.warn("Skipped peer discovery because the relay is in genesis-start mode.");
            return;
        }

        if (this.config.disableDiscovery) {
            this.logger.warn("Skipped peer discovery because the relay is in non-discovery mode.");
            return;
        }

        try {
            await this.discoverPeers();
            await this.cleanPeers();
        } catch (error) {
            this.logger.error(`Network Status: ${error.message}`);
        }

        let nextRunDelaySeconds = 600;

        if (!this.hasMinimumPeers()) {
            await this.populateSeedPeers();
            nextRunDelaySeconds = 5;
            this.logger.info(`Couldn't find enough peers. Falling back to seed peers.`);
        }

        this.scheduleUpdateNetworkStatus(nextRunDelaySeconds);
    }

    public validatePeer(peer, options: IAcceptNewPeerOptions = {}): boolean {
        if (this.config.disableDiscovery && !this.pendingPeers[peer.ip]) {
            this.logger.warn(`Rejected ${peer.ip} because the relay is in non-discovery mode.`);
            return false;
        }

        if (!isValidPeer(peer) || this.guard.isSuspended(peer) || this.pendingPeers[peer.ip]) {
            return false;
        }

        if (this.guard.isBlacklisted(peer)) {
            this.logger.debug(`Rejected peer ${peer.ip} as it is blacklisted`);
            return false;
        }

        if (!this.guard.isValidVersion(peer) && !this.guard.isWhitelisted(peer)) {
            const minimumVersions: string[] = app.resolveOptions("p2p").minimumVersions;

            this.logger.debug(
                `Rejected peer ${
                    peer.ip
                } as it doesn't meet the minimum version requirements. Expected: ${minimumVersions} - Received: ${
                    peer.version
                }`,
            );

            return false;
        }

        if (!this.guard.isValidNetwork(peer) && !options.seed) {
            this.logger.debug(
                `Rejected peer ${peer.ip} as it isn't on the same network. Expected: ${this.appConfig.get(
                    "network.nethash",
                )} - Received: ${peer.nethash}`,
            );

            return false;
        }

        return true;
    }

    /**
     * Accept and store a valid peer.
     */
    public async acceptNewPeer(peer, options: IAcceptNewPeerOptions = {}): Promise<void> {
        if (this.getPeer(peer.ip)) {
            return;
        }

        const newPeer = new Peer(peer.ip, peer.port);
        newPeer.setHeaders(peer);

        try {
            this.pendingPeers[peer.ip] = true;

            await newPeer.ping(3000);

            this.peers[peer.ip] = newPeer;

            if (!options.lessVerbose) {
                this.logger.debug(`Accepted new peer ${newPeer.ip}:${newPeer.port}`);
            }

            this.emitter.emit("peer.added", newPeer);
        } catch (error) {
            if (error instanceof PeerStatusResponseError) {
                this.logger.debug(error.message);
            } else {
                this.logger.debug(`Could not accept new peer ${newPeer.ip}:${newPeer.port}: ${error}`);
                this.guard.suspend(newPeer);
            }
        } finally {
            delete this.pendingPeers[peer.ip];
        }
    }

    /**
     * Remove peer from monitor.
     * @param {Peer} peer
     */
    public removePeer(peer): void {
        delete this.peers[peer.ip];
    }

    /**
     * Clear peers which aren't responding.
     * @param {Boolean} fast
     * @param {Boolean} tracker
     * @param {Boolean} forcePing
     */
    public async cleanPeers(fast = false, forcePing = false): Promise<void> {
        const keys = Object.keys(this.peers);
        let unresponsivePeers = 0;
        const pingDelay = fast ? 1500 : app.resolveOptions("p2p").globalTimeout;
        const max = keys.length;

        this.logger.info(`Checking ${max} peers`);
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

                    this.emitter.emit("peer.removed", peer);

                    this.removePeer(peer);

                    return null;
                }
            }),
        );

        Object.keys(peerErrors).forEach((key: any) => {
            const peerCount = peerErrors[key].length;
            this.logger.debug(`Removed ${peerCount} ${pluralize("peers", peerCount)} because of "${key}"`);
        });

        if (this.initializing) {
            this.logger.info(`${max - unresponsivePeers} of ${max} peers on the network are responsive`);
            this.logger.info(`Median Network Height: ${this.getNetworkHeight().toLocaleString()}`);
            this.logger.info(`Network PBFT status: ${this.getPBFTForgingStatus()}`);
        }
    }

    /**
     * Suspend an existing peer.
     * @param  {Peer} peer
     * @return {void}
     */
    public suspendPeer(ip): void {
        const peer = this.peers[ip];

        if (peer && !this.guard.isSuspended(peer)) {
            this.guard.suspend(peer);
        }
    }

    /**
     * Get a list of all suspended peers.
     * @return {void}
     */
    public getSuspendedPeers(): any {
        return this.guard.all();
    }

    /**
     * Get all available peers.
     * @return {Peer[]}
     */
    public getPeers(): Peer[] {
        return Object.values(this.peers) as Peer[];
    }

    /**
     * Get the peer available peers.
     * @param  {String} ip
     * @return {Peer}
     */
    public getPeer(ip): Peer {
        return this.peers[ip];
    }

    public async peerHasCommonBlocks(peer, blockIds): Promise<boolean> {
        if (await peer.hasCommonBlocks(blockIds)) {
            return true;
        }

        peer.commonBlocks = false;

        this.guard.suspend(peer);

        return false;
    }

    /**
     * Populate list of available peers from random peers.
     */
    public async discoverPeers(): Promise<void> {
        const queryAtLeastNPeers = 4;
        let queriedPeers = 0;

        const shuffledPeers = shuffle(this.getPeers());

        for (const peer of shuffledPeers) {
            try {
                const hisPeers = await peer.getPeers();
                queriedPeers++;
                await Promise.all(hisPeers.map(p => this.validateAndAcceptPeer(p, { lessVerbose: true })));
            } catch (error) {
                // Just try with the next peer from shuffledPeers.
            }

            if (this.hasMinimumPeers() && queriedPeers >= queryAtLeastNPeers) {
                return;
            }
        }
    }

    /**
     * Check if we have any peers.
     * @return {bool}
     */
    public hasPeers(): boolean {
        return !!this.getPeers().length;
    }

    /**
     * Get the median network height.
     * @return {Number}
     */
    public getNetworkHeight(): number {
        const medians = this.getPeers()
            .filter(peer => peer.state.height)
            .map(peer => peer.state.height)
            .sort((a, b) => a - b);

        return medians[Math.floor(medians.length / 2)] || 0;
    }

    /**
     * Get the PBFT Forging status.
     * @return {Number}
     */
    public getPBFTForgingStatus(): number {
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
    public async refreshPeersAfterFork(): Promise<void> {
        this.logger.info(`Refreshing ${this.getPeers().length} peers after fork.`);

        // Reset all peers, except peers banned because of causing a fork.
        await this.cleanPeers(false, true);
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
    public async downloadBlocks(fromBlockHeight): Promise<any> {
        let randomPeer;

        try {
            randomPeer = this.getRandomPeerForDownloadingBlocks();
        } catch (error) {
            this.logger.error(`Could not download blocks: ${error.message}`);

            return [];
        }
        try {
            this.logger.info(`Downloading blocks from height ${fromBlockHeight.toLocaleString()} via ${randomPeer.ip}`);

            const blocks = await randomPeer.downloadBlocks(fromBlockHeight);
            blocks.forEach(block => {
                block.ip = randomPeer.ip;
            });

            return blocks;
        } catch (error) {
            this.logger.error(`Could not download blocks: ${error.message}`);

            return this.downloadBlocks(fromBlockHeight);
        }
    }

    /**
     * Broadcast block to all peers.
     * @param  {Block}   block
     * @return {Promise}
     */
    public async broadcastBlock(block): Promise<void> {
        const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

        if (!blockchain) {
            this.logger.info(
                `Skipping broadcast of block ${block.data.height.toLocaleString()} as blockchain is not ready`,
            );
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

        this.logger.info(
            `Broadcasting block ${block.data.height.toLocaleString()} to ${pluralize("peer", peers.length, true)}`,
        );

        await Promise.all(peers.map(peer => peer.postBlock(block.toJson())));
    }

    /**
     * Broadcast transactions to a fixed number of random peers.
     * @param {Transaction[]} transactions
     */
    public async broadcastTransactions(transactions): Promise<any> {
        const peers = take(shuffle(this.getPeers()), app.resolveOptions("p2p").maxPeersBroadcast);

        this.logger.debug(
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
     * Check if too many peers are forked and if rollback is necessary.
     * Returns the number of blocks to rollback if any.
     * @return {Promise<INetworkStatus>}
     */
    public async checkNetworkHealth(): Promise<P2P.INetworkStatus> {
        if (!this.__isColdStartActive()) {
            await this.cleanPeers(false, true);
            await this.guard.resetSuspendedPeers();
        }

        const lastBlock = app.resolve("state").getLastBlock();

        const peers = this.getPeers();
        const suspendedPeers = Object.values(this.getSuspendedPeers())
            .map((suspendedPeer: any) => suspendedPeer.peer)
            .filter(peer => peer.verification !== null);

        const allPeers = [...peers, ...suspendedPeers];
        if (!allPeers.length) {
            this.logger.info("No peers available.");
            return { forked: false };
        }

        const forkedPeers = allPeers.filter(peer => peer.verification.forked);
        const majorityOnOurChain = forkedPeers.length / allPeers.length < 0.5;

        if (majorityOnOurChain) {
            this.logger.info("The majority of peers is not forked. No need to rollback.");
            return { forked: false };
        }

        const groupedByCommonHeight = groupBy(allPeers, "verification.highestCommonHeight");

        const groupedByLength = groupBy(Object.values(groupedByCommonHeight), "length");

        // Sort by longest
        // @ts-ignore
        const longest = Object.keys(groupedByLength).sort((a, b) => b - a)[0];
        const longestGroups = groupedByLength[longest];

        // Sort by highest common height DESC
        longestGroups.sort((a, b) => b[0].verification.highestCommonHeight - a[0].verification.highestCommonHeight);
        const peersMostCommonHeight = longestGroups[0];

        const { highestCommonHeight } = peersMostCommonHeight[0].verification;
        this.logger.info(
            `Rolling back to most common height ${highestCommonHeight}. Own height: ${lastBlock.data.height}`,
        );

        // Now rollback blocks equal to the distance to the most common height.
        const blocksToRollback = lastBlock.data.height - highestCommonHeight;
        return { forked: true, blocksToRollback };
    }

    /**
     * Dump the list of active peers.
     * @return {void}
     */
    public cachePeers(): void {
        const peers = Object.values(this.peers).map(peer => ({
            ip: peer.ip,
            port: peer.port,
            version: peer.version,
        }));

        try {
            fs.writeFileSync(`${process.env.CORE_PATH_CACHE}/peers.json`, JSON.stringify(peers, null, 2));
        } catch (err) {
            this.logger.error(`Failed to dump the peer list because of "${err.message}"`);
        }
    }

    /**
     * Get last 10 block IDs from database.
     * @return {[]String}
     */
    public async __getRecentBlockIds(): Promise<string[]> {
        return app.resolvePlugin<Database.IDatabaseService>("database").getRecentBlockIds();
    }

    /**
     * Determines if coldstart is still active.
     * We need this for the network to start, so we dont forge, while
     * not all peers are up, or the network is not active
     */
    public __isColdStartActive(): boolean {
        return this.coldStartPeriod.isAfter(dato());
    }

    /**
     * Check if the node can connect to any DNS host.
     * @return {void}
     */
    public async __checkDNSConnectivity(options): Promise<void> {
        try {
            const host = await checkDNS(options);

            this.logger.info(`Your network connectivity has been verified by ${host}`);
        } catch (error) {
            this.logger.error(error.message);
        }
    }

    /**
     * Check if the node can connect to any NTP host.
     * @return {void}
     */
    public async __checkNTPConnectivity(options): Promise<void> {
        try {
            const { host, time } = await checkNTP(options);

            this.logger.info(`Your NTP connectivity has been verified by ${host}`);

            this.logger.info(`Local clock is off by ${time.t < 0 ? "-" : ""}${prettyMs(Math.abs(time.t))} from NTP`);
        } catch (error) {
            this.logger.error(error.message);
        }
    }

    private async validateAndAcceptPeer(peer, options: IAcceptNewPeerOptions = {}): Promise<void> {
        if (this.validatePeer(peer, options)) {
            await this.acceptNewPeer(peer, options);
        }
    }

    /**
     * Get a random peer for downloading blocks.
     * @return {Peer}
     * @throws {Error} if a peer could not be selected
     */
    private getRandomPeerForDownloadingBlocks(): Peer {
        const now = new Date().getTime();
        const peersAll = this.getPeers();

        const peersFiltered = peersAll.filter(peer => peer.ban < now && !peer.verification.forked);

        if (peersFiltered.length === 0) {
            throw new Error(
                `Failed to pick a random peer from our list of ${peersAll.length} peers: ` +
                    `all are either banned or on a different chain than us`,
            );
        }

        return sample(peersFiltered);
    }

    /**
     * Schedule the next update network status.
     * @param {Number} nextUpdateInSeconds
     * @returns {void}
     */
    private async scheduleUpdateNetworkStatus(nextUpdateInSeconds): Promise<void> {
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
    private hasMinimumPeers(): boolean {
        if (this.config.ignoreMinimumNetworkReach) {
            this.logger.warn("Ignored the minimum network reach because the relay is in seed mode.");

            return true;
        }

        return Object.keys(this.peers).length >= app.resolveOptions("p2p").minimumNetworkReach;
    }

    /**
     * Populate the initial seed list.
     * @return {void}
     */
    private async populateSeedPeers(): Promise<any> {
        const peerList = this.appConfig.get("peers.list");

        if (!peerList) {
            app.forceExit("No seed peers defined in peers.json");
        }

        const peers = peerList.map(peer => {
            peer.version = app.getVersion();
            return peer;
        });

        // @TODO: check what we want to resolve
        const localConfigPeers = app.resolveOptions("p2p").peers;
        if (localConfigPeers) {
            localConfigPeers.forEach(peerA => {
                if (!peers.some(peerB => peerA.ip === peerB.ip && peerA.port === peerB.port)) {
                    peers.push(peerA);
                }
            });
        }

        return Promise.all(
            peers.map((peer: any) => {
                this.guard.delete(peer.ip);
                return this.validateAndAcceptPeer(peer, { seed: true, lessVerbose: true });
            }),
        );
    }
}

export const monitor = new Monitor();
