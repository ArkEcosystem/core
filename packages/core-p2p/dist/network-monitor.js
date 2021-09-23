"use strict";
/* tslint:disable:max-line-length */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const dist_1 = require("@arkecosystem/core-event-emitter/dist");
const delay_1 = __importDefault(require("delay"));
const lodash_groupby_1 = __importDefault(require("lodash.groupby"));
const lodash_shuffle_1 = __importDefault(require("lodash.shuffle"));
const lodash_take_1 = __importDefault(require("lodash.take"));
const pluralize_1 = __importDefault(require("pluralize"));
const pretty_ms_1 = __importDefault(require("pretty-ms"));
const network_state_1 = require("./network-state");
const utils_1 = require("./utils");
const defaultDownloadChunkSize = 400;
class NetworkMonitor {
    constructor({ communicator, processor, storage, options, }) {
        this.initializing = true;
        this.coldStart = false;
        /**
         * If downloading some chunk fails but nevertheless we manage to download higher chunks,
         * then they are stored here for later retrieval.
         */
        this.downloadedChunksCache = {};
        /**
         * Maximum number of entries to keep in `downloadedChunksCache`.
         * At 400 blocks per chunk, 100 chunks would amount to 40k blocks.
         */
        this.downloadedChunksCacheMax = 100;
        this.downloadChunkSize = defaultDownloadChunkSize;
        this.logger = core_container_1.app.resolvePlugin("logger");
        this.emitter = core_container_1.app.resolvePlugin("event-emitter");
        this.config = options;
        this.communicator = communicator;
        this.processor = processor;
        this.storage = storage;
        this.rateLimiter = utils_1.buildRateLimiter(options);
    }
    getServer() {
        return this.server;
    }
    setServer(server) {
        this.server = server;
    }
    stopServer() {
        if (this.server) {
            this.server.removeAllListeners();
            this.server.destroy();
            this.server = undefined;
        }
    }
    async start() {
        await this.checkDNSConnectivity(this.config.dns);
        await this.checkNTPConnectivity(this.config.ntp);
        await this.populateSeedPeers();
        if (this.config.skipDiscovery) {
            this.logger.warn("Skipped peer discovery because the relay is in skip-discovery mode.");
        }
        else {
            await this.updateNetworkStatus(true);
            for (const [version, peers] of Object.entries(lodash_groupby_1.default(this.storage.getPeers(), "version"))) {
                this.logger.info(`Discovered ${pluralize_1.default("peer", peers.length, true)} with v${version}.`);
            }
        }
        // Give time to cooldown rate limits after peer verifier finished.
        await delay_1.default(1000);
        this.initializing = false;
    }
    async updateNetworkStatus(initialRun) {
        if (process.env.NODE_ENV === "test") {
            return;
        }
        if (this.config.networkStart) {
            this.coldStart = true;
            this.logger.warn("Entering cold start because the relay is in genesis-start mode.");
            return;
        }
        if (this.config.disableDiscovery) {
            this.logger.warn("Skipped peer discovery because the relay is in non-discovery mode.");
            return;
        }
        try {
            if (await this.discoverPeers(initialRun)) {
                await this.cleansePeers();
            }
        }
        catch (error) {
            this.logger.error(`Network Status: ${error.message}`);
        }
        let nextRunDelaySeconds = 600;
        if (!this.hasMinimumPeers()) {
            await this.populateSeedPeers();
            nextRunDelaySeconds = 60;
            this.logger.info(`Couldn't find enough peers. Falling back to seed peers.`);
        }
        this.scheduleUpdateNetworkStatus(nextRunDelaySeconds);
    }
    async cleansePeers({ fast = false, forcePing = false, peerCount, } = {}) {
        let peers = this.storage.getPeers();
        let max = peers.length;
        let unresponsivePeers = 0;
        const pingDelay = fast ? 1500 : core_container_1.app.resolveOptions("p2p").verifyTimeout;
        if (peerCount) {
            peers = lodash_shuffle_1.default(peers).slice(0, peerCount);
            max = Math.min(peers.length, peerCount);
        }
        this.logger.info(`Checking ${max} peers`);
        const peerErrors = {};
        // we use Promise.race to cut loose in case some communicator.ping() does not resolve within the delay
        // in that case we want to keep on with our program execution while ping promises can finish in the background
        await Promise.race([
            Promise.all(peers.map(async (peer) => {
                try {
                    await this.communicator.ping(peer, pingDelay, forcePing);
                }
                catch (error) {
                    unresponsivePeers++;
                    if (peerErrors[error]) {
                        peerErrors[error].push(peer);
                    }
                    else {
                        peerErrors[error] = [peer];
                    }
                    this.emitter.emit("internal.p2p.disconnectPeer", { peer });
                    this.emitter.emit(dist_1.ApplicationEvents.PeerRemoved, peer);
                    return undefined;
                }
            })),
            delay_1.default(pingDelay),
        ]);
        for (const key of Object.keys(peerErrors)) {
            const peerCount = peerErrors[key].length;
            this.logger.debug(`Removed ${peerCount} ${pluralize_1.default("peers", peerCount)} because of "${key}"`);
        }
        if (this.initializing) {
            this.logger.info(`${max - unresponsivePeers} of ${max} peers on the network are responsive`);
            this.logger.info(`Median Network Height: ${this.getNetworkHeight().toLocaleString()}`);
        }
    }
    async discoverPeers(pingAll) {
        const maxPeersPerPeer = 50;
        const ownPeers = this.storage.getPeers();
        const theirPeers = Object.values((await Promise.all(lodash_shuffle_1.default(this.storage.getPeers())
            .slice(0, 8)
            .map(async (peer) => {
            try {
                const hisPeers = await this.communicator.getPeers(peer);
                return hisPeers || [];
            }
            catch (error) {
                this.logger.debug(`Failed to get peers from ${peer.ip}: ${error.message}`);
                return [];
            }
        })))
            .map(peers => lodash_shuffle_1.default(peers)
            .slice(0, maxPeersPerPeer)
            .reduce((acc, curr) => ({ ...acc, ...{ [curr.ip]: curr } }), {}))
            .reduce((acc, curr) => ({ ...acc, ...curr }), {}));
        if (pingAll || !this.hasMinimumPeers() || ownPeers.length < theirPeers.length * 0.75) {
            await Promise.all(theirPeers.map(p => this.processor.validateAndAcceptPeer(p, { lessVerbose: true })));
            this.pingPeerPorts(pingAll);
            return true;
        }
        this.pingPeerPorts();
        return false;
    }
    async getRateLimitStatus(ip, endpoint) {
        return {
            blocked: await this.rateLimiter.isBlocked(ip),
            exceededLimitOnEndpoint: await this.rateLimiter.hasExceededRateLimit(ip, endpoint),
        };
    }
    getRateLimitedEndpoints() {
        return this.rateLimiter.getRateLimitedEndpoints();
    }
    async isBlockedByRateLimit(ip) {
        return this.rateLimiter.isBlocked(ip);
    }
    isColdStart() {
        return this.coldStart;
    }
    completeColdStart() {
        this.coldStart = false;
    }
    getNetworkHeight() {
        const medians = this.storage
            .getPeers()
            .filter(peer => peer.state.height)
            .map(peer => peer.state.height)
            .sort((a, b) => a - b);
        return medians[Math.floor(medians.length / 2)] || 0;
    }
    async getNetworkState() {
        await this.cleansePeers({ fast: true, forcePing: true });
        return network_state_1.NetworkState.analyze(this, this.storage);
    }
    async refreshPeersAfterFork() {
        this.logger.info(`Refreshing ${this.storage.getPeers().length} peers after fork.`);
        await this.cleansePeers({ forcePing: true });
    }
    async checkNetworkHealth() {
        await this.discoverPeers(true);
        await this.cleansePeers({ forcePing: true });
        const lastBlock = core_container_1.app
            .resolvePlugin("state")
            .getStore()
            .getLastBlock();
        const allPeers = this.storage.getPeers();
        if (!allPeers.length) {
            this.logger.info("No peers available.");
            return { forked: false };
        }
        const forkedPeers = allPeers.filter((peer) => peer.isForked());
        const majorityOnOurChain = forkedPeers.length / allPeers.length < 0.5;
        if (majorityOnOurChain) {
            this.logger.info("The majority of peers is not forked. No need to rollback.");
            return { forked: false };
        }
        const groupedByCommonHeight = lodash_groupby_1.default(allPeers, "verification.highestCommonHeight");
        const groupedByLength = lodash_groupby_1.default(Object.values(groupedByCommonHeight), "length");
        // Sort by longest
        // @ts-ignore
        const longest = Object.keys(groupedByLength).sort((a, b) => b - a)[0];
        const longestGroups = groupedByLength[longest];
        // Sort by highest common height DESC
        longestGroups.sort((a, b) => b[0].verificationResult.highestCommonHeight - a[0].verificationResult.highestCommonHeight);
        const peersMostCommonHeight = longestGroups[0];
        const { highestCommonHeight } = peersMostCommonHeight[0].verificationResult;
        this.logger.info(`Rolling back to most common height ${highestCommonHeight}. Own height: ${lastBlock.data.height}`);
        // Now rollback blocks equal to the distance to the most common height.
        return { forked: true, blocksToRollback: Math.min(lastBlock.data.height - highestCommonHeight, 5000) };
    }
    async downloadBlocksFromHeight(fromBlockHeight, maxParallelDownloads = 10) {
        const peersAll = this.storage.getPeers();
        if (peersAll.length === 0) {
            this.logger.error(`Could not download blocks: we have 0 peers`);
            return [];
        }
        const peersNotForked = lodash_shuffle_1.default(peersAll.filter(peer => !peer.isForked()));
        if (peersNotForked.length === 0) {
            this.logger.error(`Could not download blocks: We have ${pluralize_1.default("peer", peersAll.length, true)} but all ` +
                `of them are on a different chain than us`);
            return [];
        }
        const networkHeight = this.getNetworkHeight();
        let chunksMissingToSync;
        if (!networkHeight || networkHeight <= fromBlockHeight) {
            chunksMissingToSync = 1;
        }
        else {
            chunksMissingToSync = Math.ceil((networkHeight - fromBlockHeight) / this.downloadChunkSize);
        }
        const chunksToDownload = Math.min(chunksMissingToSync, peersNotForked.length, maxParallelDownloads);
        // We must return an uninterrupted sequence of blocks, starting from `fromBlockHeight`,
        // with sequential heights, without gaps.
        const downloadJobs = [];
        const downloadResults = [];
        let someJobFailed = false;
        let chunksHumanReadable = "";
        for (let i = 0; i < chunksToDownload; i++) {
            const height = fromBlockHeight + this.downloadChunkSize * i;
            const isLastChunk = i === chunksToDownload - 1;
            const blocksRange = `[${height + 1}, ${isLastChunk ? ".." : height + this.downloadChunkSize}]`;
            downloadJobs.push(async () => {
                if (this.downloadedChunksCache[height] !== undefined) {
                    downloadResults[i] = this.downloadedChunksCache[height];
                    // Remove it from the cache so that it does not get served many times
                    // from the cache. In case of network reorganization or downloading
                    // flawed chunks we want to re-download from another peer.
                    delete this.downloadedChunksCache[height];
                    return;
                }
                let blocks;
                let peer;
                let peerPrint;
                // As a first peer to try, pick such a peer that different jobs use different peers.
                // If that peer fails then pick randomly from the remaining peers that have not
                // been first-attempt for any job.
                const peersToTry = [peersNotForked[i], ...lodash_shuffle_1.default(peersNotForked.slice(chunksToDownload))];
                for (peer of peersToTry) {
                    peerPrint = `${peer.ip}:${peer.port}`;
                    try {
                        blocks = await this.communicator.getPeerBlocks(peer, {
                            fromBlockHeight: height,
                            blockLimit: this.downloadChunkSize,
                        });
                        if (blocks.length === this.downloadChunkSize || (isLastChunk && blocks.length > 0)) {
                            this.logger.debug(`Downloaded blocks ${blocksRange} (${blocks.length}) ` + `from ${peerPrint}`);
                            downloadResults[i] = blocks;
                            return;
                        }
                    }
                    catch (error) {
                        this.logger.info(`Failed to download blocks ${blocksRange} from ${peerPrint}: ${error.message}`);
                    }
                    if (someJobFailed) {
                        this.logger.info(`Giving up on trying to download blocks ${blocksRange}: ` + `another download job failed`);
                        return;
                    }
                }
                someJobFailed = true;
                throw new Error(`Could not download blocks ${blocksRange} from any of ${pluralize_1.default("peer", peersToTry.length, true)}. ` + `Last attempt returned ${pluralize_1.default("block", blocks.length, true)} from peer ${peerPrint}.`);
            });
            if (chunksHumanReadable.length > 0) {
                chunksHumanReadable += ", ";
            }
            chunksHumanReadable += blocksRange;
        }
        this.logger.debug(`Downloading blocks in chunks: ${chunksHumanReadable}`);
        let firstFailureMessage;
        try {
            // Convert the array of AsyncFunction to an array of Promise by calling the functions.
            await Promise.all(downloadJobs.map(f => f()));
        }
        catch (error) {
            firstFailureMessage = error.message;
        }
        let downloadedBlocks = [];
        let i;
        for (i = 0; i < chunksToDownload; i++) {
            if (downloadResults[i] === undefined) {
                this.logger.error(firstFailureMessage);
                break;
            }
            downloadedBlocks = [...downloadedBlocks, ...downloadResults[i]];
        }
        // Save any downloaded chunks that are higher than a failed chunk for later reuse.
        for (i++; i < chunksToDownload; i++) {
            if (downloadResults[i] !== undefined &&
                Object.keys(this.downloadedChunksCache).length <= this.downloadedChunksCacheMax) {
                this.downloadedChunksCache[fromBlockHeight + this.downloadChunkSize * i] = downloadResults[i];
            }
        }
        // if we did not manage to download any block, reduce chunk size for next time
        this.downloadChunkSize =
            downloadedBlocks.length === 0 ? Math.ceil(this.downloadChunkSize / 10) : defaultDownloadChunkSize;
        return downloadedBlocks;
    }
    async broadcastBlock(block) {
        const blockchain = core_container_1.app.resolvePlugin("blockchain");
        if (!blockchain) {
            this.logger.info(`Skipping broadcast of block ${block.data.height.toLocaleString()} as blockchain is not ready`);
            return;
        }
        let blockPing = blockchain.getBlockPing();
        let peers = this.storage.getPeers();
        if (blockPing && blockPing.block.id === block.data.id) {
            // wait a bit before broadcasting if a bit early
            const diff = blockPing.last - blockPing.first;
            const maxHop = 4;
            let broadcastQuota = (maxHop - blockPing.count) / maxHop;
            if (diff < 500 && broadcastQuota > 0) {
                await delay_1.default(500 - diff);
                blockPing = blockchain.getBlockPing();
                // got aleady a new block, no broadcast
                if (blockPing.block.id !== block.data.id) {
                    return;
                }
                broadcastQuota = (maxHop - blockPing.count) / maxHop;
            }
            peers = broadcastQuota <= 0 ? [] : lodash_shuffle_1.default(peers).slice(0, Math.ceil(broadcastQuota * peers.length));
            // select a portion of our peers according to quota calculated before
        }
        this.logger.info(`Broadcasting block ${block.data.height.toLocaleString()} to ${pluralize_1.default("peer", peers.length, true)}`);
        await Promise.all(peers.map(peer => this.communicator.postBlock(peer, block)));
    }
    async broadcastTransactions(transactions) {
        const peers = lodash_take_1.default(lodash_shuffle_1.default(this.storage.getPeers()), core_container_1.app.resolveOptions("p2p").maxPeersBroadcast);
        this.logger.debug(`Broadcasting ${pluralize_1.default("transaction", transactions.length, true)} to ${pluralize_1.default("peer", peers.length, true)}`);
        const transactionsBroadcast = transactions.map(transaction => transaction.toJson());
        return Promise.all(peers.map((peer) => this.communicator.postTransactions(peer, transactionsBroadcast)));
    }
    async pingPeerPorts(pingAll) {
        let peers = this.storage.getPeers();
        if (!pingAll) {
            peers = lodash_shuffle_1.default(peers).slice(0, Math.floor(peers.length / 2));
        }
        this.logger.debug(`Checking ports of ${pluralize_1.default("peer", peers.length, true)}.`);
        Promise.all(peers.map(async (peer) => {
            try {
                await this.communicator.pingPorts(peer);
            }
            catch (error) {
                return undefined;
            }
        }));
    }
    async checkDNSConnectivity(options) {
        try {
            const host = await utils_1.checkDNS(options);
            this.logger.info(`Your network connectivity has been verified by ${host}`);
        }
        catch (error) {
            this.logger.error(error.message);
        }
    }
    async checkNTPConnectivity(options) {
        try {
            const { host, time } = await utils_1.checkNTP(options);
            this.logger.info(`Your NTP connectivity has been verified by ${host}`);
            this.logger.info(`Local clock is off by ${time.t < 0 ? "-" : ""}${pretty_ms_1.default(Math.abs(time.t))} from NTP`);
        }
        catch (error) {
            this.logger.error(error.message);
        }
    }
    async scheduleUpdateNetworkStatus(nextUpdateInSeconds) {
        if (this.nextUpdateNetworkStatusScheduled) {
            return;
        }
        this.nextUpdateNetworkStatusScheduled = true;
        await delay_1.default(nextUpdateInSeconds * 1000);
        this.nextUpdateNetworkStatusScheduled = false;
        this.updateNetworkStatus();
    }
    hasMinimumPeers() {
        if (this.config.ignoreMinimumNetworkReach) {
            this.logger.warn("Ignored the minimum network reach because the relay is in seed mode.");
            return true;
        }
        return Object.keys(this.storage.getPeers()).length >= core_container_1.app.resolveOptions("p2p").minimumNetworkReach;
    }
    async populateSeedPeers() {
        const peerList = core_container_1.app.getConfig().get("peers.list");
        if (!peerList) {
            core_container_1.app.forceExit("No seed peers defined in peers.json");
        }
        const peers = peerList.map(peer => {
            peer.version = core_container_1.app.getVersion();
            return peer;
        });
        return Promise.all(Object.values(peers).map((peer) => {
            this.storage.forgetPeer(peer);
            return this.processor.validateAndAcceptPeer(peer, { seed: true, lessVerbose: true });
        }));
    }
}
exports.NetworkMonitor = NetworkMonitor;
//# sourceMappingURL=network-monitor.js.map