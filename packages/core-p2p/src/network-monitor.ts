/* tslint:disable:max-line-length */

import { app } from "@arkecosystem/core-container";
import { ApplicationEvents } from "@arkecosystem/core-event-emitter/dist";
import { Blockchain, EventEmitter, Logger, P2P } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
import delay from "delay";
import groupBy from "lodash.groupby";
import shuffle from "lodash.shuffle";
import take from "lodash.take";
import pluralize from "pluralize";
import prettyMs from "pretty-ms";
import SocketCluster from "socketcluster";
import { IPeerData } from "./interfaces";
import { NetworkState } from "./network-state";
import { RateLimiter } from "./rate-limiter";
import { buildRateLimiter, checkDNS, checkNTP } from "./utils";

export class NetworkMonitor implements P2P.INetworkMonitor {
    public server: SocketCluster;
    public config: any;
    public nextUpdateNetworkStatusScheduled: boolean;
    private initializing: boolean = true;
    private coldStart: boolean = false;

    /**
     * If downloading some chunk fails but nevertheless we manage to download higher chunks,
     * then they are stored here for later retrieval.
     */
    private downloadedChunksCache: { [key: string]: Interfaces.IBlockData[] } = {};

    /**
     * Maximum number of entries to keep in `downloadedChunksCache`.
     * At 400 blocks per chunk, 100 chunks would amount to 40k blocks.
     */
    private downloadedChunksCacheMax: number = 100;

    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    private readonly emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

    private readonly communicator: P2P.IPeerCommunicator;
    private readonly processor: P2P.IPeerProcessor;
    private readonly storage: P2P.IPeerStorage;
    private readonly rateLimiter: RateLimiter;

    public constructor({
        communicator,
        processor,
        storage,
        options,
    }: {
        communicator: P2P.IPeerCommunicator;
        processor: P2P.IPeerProcessor;
        storage: P2P.IPeerStorage;
        options;
    }) {
        this.config = options;
        this.communicator = communicator;
        this.processor = processor;
        this.storage = storage;
        this.rateLimiter = buildRateLimiter(options);
    }

    public getServer(): SocketCluster {
        return this.server;
    }

    public setServer(server: SocketCluster): void {
        this.server = server;
    }

    public stopServer(): void {
        if (this.server) {
            this.server.removeAllListeners();
            this.server.destroy();
            this.server = undefined;
        }
    }

    public async start(): Promise<void> {
        await this.checkDNSConnectivity(this.config.dns);
        await this.checkNTPConnectivity(this.config.ntp);

        await this.populateSeedPeers();

        if (this.config.skipDiscovery) {
            this.logger.warn("Skipped peer discovery because the relay is in skip-discovery mode.");
        } else {
            await this.updateNetworkStatus(true);

            for (const [version, peers] of Object.entries(groupBy(this.storage.getPeers(), "version"))) {
                this.logger.info(`Discovered ${pluralize("peer", peers.length, true)} with v${version}.`);
            }
        }

        // Give time to cooldown rate limits after peer verifier finished.
        await delay(1000);

        this.initializing = false;
    }

    public async updateNetworkStatus(initialRun?: boolean): Promise<void> {
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
        } catch (error) {
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

    public async cleansePeers({
        fast = false,
        forcePing = false,
        peerCount,
    }: { fast?: boolean; forcePing?: boolean; peerCount?: number } = {}): Promise<void> {
        let peers = this.storage.getPeers();
        let max = peers.length;

        let unresponsivePeers = 0;
        const pingDelay = fast ? 1500 : app.resolveOptions("p2p").verifyTimeout;

        if (peerCount) {
            peers = shuffle(peers).slice(0, peerCount);
            max = Math.min(peers.length, peerCount);
        }

        this.logger.info(`Checking ${max} peers`);
        const peerErrors = {};
        await Promise.all(
            peers.map(async peer => {
                try {
                    await this.communicator.ping(peer, pingDelay, forcePing);
                } catch (error) {
                    unresponsivePeers++;

                    if (peerErrors[error]) {
                        peerErrors[error].push(peer);
                    } else {
                        peerErrors[error] = [peer];
                    }

                    this.emitter.emit("internal.p2p.disconnectPeer", { peer });
                    this.emitter.emit(ApplicationEvents.PeerRemoved, peer);

                    return undefined;
                }
            }),
        );

        for (const key of Object.keys(peerErrors)) {
            const peerCount = peerErrors[key].length;
            this.logger.debug(`Removed ${peerCount} ${pluralize("peers", peerCount)} because of "${key}"`);
        }

        if (this.initializing) {
            this.logger.info(`${max - unresponsivePeers} of ${max} peers on the network are responsive`);
            this.logger.info(`Median Network Height: ${this.getNetworkHeight().toLocaleString()}`);
        }
    }

    public async discoverPeers(pingAll?: boolean): Promise<boolean> {
        const maxPeersPerPeer: number = 50;
        const ownPeers: P2P.IPeer[] = this.storage.getPeers();
        const theirPeers: P2P.IPeer[] = Object.values(
            (await Promise.all(
                shuffle(this.storage.getPeers())
                    .slice(0, 8)
                    .map(async (peer: P2P.IPeer) => {
                        try {
                            const hisPeers = await this.communicator.getPeers(peer);
                            return hisPeers || [];
                        } catch (error) {
                            this.logger.debug(`Failed to get peers from ${peer.ip}: ${error.message}`);
                            return [];
                        }
                    }),
            ))
                .map(peers =>
                    shuffle(peers)
                        .slice(0, maxPeersPerPeer)
                        .reduce((acc, curr) => ({ ...acc, ...{ [curr.ip]: curr } }), {}),
                )
                .reduce((acc, curr) => ({ ...acc, ...curr }), {}),
        );

        if (pingAll || !this.hasMinimumPeers() || ownPeers.length < theirPeers.length * 0.75) {
            await Promise.all(theirPeers.map(p => this.processor.validateAndAcceptPeer(p, { lessVerbose: true })));
            this.pingPeerPorts(pingAll);

            return true;
        }

        this.pingPeerPorts();

        return false;
    }

    public async getRateLimitStatus(ip: string, endpoint?: string): Promise<P2P.IRateLimitStatus> {
        return {
            blocked: await this.rateLimiter.isBlocked(ip),
            exceededLimitOnEndpoint: await this.rateLimiter.hasExceededRateLimit(ip, endpoint),
        };
    }

    public getRateLimitedEndpoints(): string[] {
        return this.rateLimiter.getRateLimitedEndpoints();
    }

    public async isBlockedByRateLimit(ip: string): Promise<boolean> {
        return this.rateLimiter.isBlocked(ip);
    }

    public isColdStart(): boolean {
        return this.coldStart;
    }

    public completeColdStart(): void {
        this.coldStart = false;
    }

    public getNetworkHeight(): number {
        const medians = this.storage
            .getPeers()
            .filter(peer => peer.state.height)
            .map(peer => peer.state.height)
            .sort((a, b) => a - b);

        return medians[Math.floor(medians.length / 2)] || 0;
    }

    public async getNetworkState(): Promise<P2P.INetworkState> {
        await this.cleansePeers({ fast: true, forcePing: true });
        return NetworkState.analyze(this, this.storage);
    }

    public async refreshPeersAfterFork(): Promise<void> {
        this.logger.info(`Refreshing ${this.storage.getPeers().length} peers after fork.`);

        await this.cleansePeers({ forcePing: true });
    }

    public async checkNetworkHealth(): Promise<P2P.INetworkStatus> {
        await this.discoverPeers(true);
        await this.cleansePeers({ forcePing: true });

        const lastBlock = app
            .resolvePlugin("state")
            .getStore()
            .getLastBlock();

        const allPeers: P2P.IPeer[] = this.storage.getPeers();

        if (!allPeers.length) {
            this.logger.info("No peers available.");

            return { forked: false };
        }

        const forkedPeers: P2P.IPeer[] = allPeers.filter((peer: P2P.IPeer) => peer.isForked());
        const majorityOnOurChain: boolean = forkedPeers.length / allPeers.length < 0.5;

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
        longestGroups.sort(
            (a, b) => b[0].verificationResult.highestCommonHeight - a[0].verificationResult.highestCommonHeight,
        );
        const peersMostCommonHeight = longestGroups[0];

        const { highestCommonHeight } = peersMostCommonHeight[0].verificationResult;
        this.logger.info(
            `Rolling back to most common height ${highestCommonHeight}. Own height: ${lastBlock.data.height}`,
        );

        // Now rollback blocks equal to the distance to the most common height.
        return { forked: true, blocksToRollback: Math.min(lastBlock.data.height - highestCommonHeight, 5000) };
    }

    public async downloadBlocksFromHeight(
        fromBlockHeight: number,
        maxParallelDownloads: number = 10,
    ): Promise<Interfaces.IBlockData[]> {
        const peersAll: P2P.IPeer[] = this.storage.getPeers();

        if (peersAll.length === 0) {
            this.logger.error(`Could not download blocks: we have 0 peers`);
            return [];
        }

        const peersNotForked: P2P.IPeer[] = shuffle(peersAll.filter(peer => !peer.isForked()));

        if (peersNotForked.length === 0) {
            this.logger.error(
                `Could not download blocks: We have ${pluralize("peer", peersAll.length, true)} but all ` +
                    `of them are on a different chain than us`,
            );
            return [];
        }

        const networkHeight: number = this.getNetworkHeight();
        const chunkSize: number = 400;
        let chunksMissingToSync: number;
        if (!networkHeight || networkHeight <= fromBlockHeight) {
            chunksMissingToSync = 1;
        } else {
            chunksMissingToSync = Math.ceil((networkHeight - fromBlockHeight) / chunkSize);
        }
        const chunksToDownload: number = Math.min(chunksMissingToSync, peersNotForked.length, maxParallelDownloads);

        // We must return an uninterrupted sequence of blocks, starting from `fromBlockHeight`,
        // with sequential heights, without gaps.

        const downloadJobs = [];
        const downloadResults = [];
        let someJobFailed: boolean = false;
        let chunksHumanReadable: string = "";

        for (let i = 0; i < chunksToDownload; i++) {
            const height: number = fromBlockHeight + chunkSize * i;
            const isLastChunk: boolean = i === chunksToDownload - 1;
            const blocksRange: string = `[${height + 1}, ${isLastChunk ? ".." : height + chunkSize}]`;

            downloadJobs.push(async () => {
                if (this.downloadedChunksCache[height] !== undefined) {
                    downloadResults[i] = this.downloadedChunksCache[height];
                    // Remove it from the cache so that it does not get served many times
                    // from the cache. In case of network reorganization or downloading
                    // flawed chunks we want to re-download from another peer.
                    delete this.downloadedChunksCache[height];
                    return;
                }

                let blocks: Interfaces.IBlockData[];
                let peer: P2P.IPeer;
                let peerPrint: string;

                // As a first peer to try, pick such a peer that different jobs use different peers.
                // If that peer fails then pick randomly from the remaining peers that have not
                // been first-attempt for any job.
                const peersToTry = [peersNotForked[i], ...shuffle(peersNotForked.slice(chunksToDownload))];

                for (peer of peersToTry) {
                    peerPrint = `${peer.ip}:${peer.port}`;
                    try {
                        blocks = await this.communicator.getPeerBlocks(peer, { fromBlockHeight: height });

                        if (blocks.length === chunkSize || (isLastChunk && blocks.length > 0)) {
                            this.logger.debug(
                                `Downloaded blocks ${blocksRange} (${blocks.length}) ` + `from ${peerPrint}`,
                            );
                            downloadResults[i] = blocks;
                            return;
                        }
                    } catch (error) {
                        this.logger.info(
                            `Failed to download blocks ${blocksRange} from ${peerPrint}: ${error.message}`,
                        );
                    }

                    if (someJobFailed) {
                        this.logger.info(
                            `Giving up on trying to download blocks ${blocksRange}: ` + `another download job failed`,
                        );
                        return;
                    }
                }

                someJobFailed = true;

                throw new Error(
                    `Could not download blocks ${blocksRange} from any of ${pluralize(
                        "peer",
                        peersToTry.length,
                        true,
                    )}. ` + `Last attempt returned ${pluralize("block", blocks.length, true)} from peer ${peerPrint}.`,
                );
            });

            if (chunksHumanReadable.length > 0) {
                chunksHumanReadable += ", ";
            }
            chunksHumanReadable += blocksRange;
        }

        this.logger.debug(`Downloading blocks in chunks: ${chunksHumanReadable}`);

        let firstFailureMessage: string;

        try {
            // Convert the array of AsyncFunction to an array of Promise by calling the functions.
            await Promise.all(downloadJobs.map(f => f()));
        } catch (error) {
            firstFailureMessage = error.message;
        }

        let downloadedBlocks: Interfaces.IBlockData[] = [];

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
            if (
                downloadResults[i] !== undefined &&
                Object.keys(this.downloadedChunksCache).length <= this.downloadedChunksCacheMax
            ) {
                this.downloadedChunksCache[fromBlockHeight + chunkSize * i] = downloadResults[i];
            }
        }

        return downloadedBlocks;
    }

    public async broadcastBlock(block: Interfaces.IBlock): Promise<void> {
        const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

        if (!blockchain) {
            this.logger.info(
                `Skipping broadcast of block ${block.data.height.toLocaleString()} as blockchain is not ready`,
            );
            return;
        }

        let blockPing = blockchain.getBlockPing();
        let peers: P2P.IPeer[] = this.storage.getPeers();

        if (blockPing && blockPing.block.id === block.data.id) {
            // wait a bit before broadcasting if a bit early
            const diff = blockPing.last - blockPing.first;
            const maxHop = 4;
            let broadcastQuota: number = (maxHop - blockPing.count) / maxHop;

            if (diff < 500 && broadcastQuota > 0) {
                await delay(500 - diff);

                blockPing = blockchain.getBlockPing();

                // got aleady a new block, no broadcast
                if (blockPing.block.id !== block.data.id) {
                    return;
                }

                broadcastQuota = (maxHop - blockPing.count) / maxHop;
            }

            peers = broadcastQuota <= 0 ? [] : shuffle(peers).slice(0, Math.ceil(broadcastQuota * peers.length));
            // select a portion of our peers according to quota calculated before
        }

        this.logger.info(
            `Broadcasting block ${block.data.height.toLocaleString()} to ${pluralize("peer", peers.length, true)}`,
        );

        await Promise.all(peers.map(peer => this.communicator.postBlock(peer, block)));
    }

    public async broadcastTransactions(transactions: Interfaces.ITransaction[]): Promise<any> {
        const peers: P2P.IPeer[] = take(shuffle(this.storage.getPeers()), app.resolveOptions("p2p").maxPeersBroadcast);

        this.logger.debug(
            `Broadcasting ${pluralize("transaction", transactions.length, true)} to ${pluralize(
                "peer",
                peers.length,
                true,
            )}`,
        );

        const transactionsBroadcast: Interfaces.ITransactionJson[] = transactions.map(transaction =>
            transaction.toJson(),
        );

        return Promise.all(
            peers.map((peer: P2P.IPeer) => this.communicator.postTransactions(peer, transactionsBroadcast)),
        );
    }

    private async pingPeerPorts(pingAll?: boolean): Promise<void> {
        let peers = this.storage.getPeers();
        if (!pingAll) {
            peers = shuffle(peers).slice(0, Math.floor(peers.length / 2));
        }

        this.logger.debug(`Checking ports of ${pluralize("peer", peers.length, true)}.`);

        Promise.all(
            peers.map(async peer => {
                try {
                    await this.communicator.pingPorts(peer);
                } catch (error) {
                    return undefined;
                }
            }),
        );
    }

    private async checkDNSConnectivity(options): Promise<void> {
        try {
            const host = await checkDNS(options);

            this.logger.info(`Your network connectivity has been verified by ${host}`);
        } catch (error) {
            this.logger.error(error.message);
        }
    }

    private async checkNTPConnectivity(options): Promise<void> {
        try {
            const { host, time } = await checkNTP(options);

            this.logger.info(`Your NTP connectivity has been verified by ${host}`);

            this.logger.info(`Local clock is off by ${time.t < 0 ? "-" : ""}${prettyMs(Math.abs(time.t))} from NTP`);
        } catch (error) {
            this.logger.error(error.message);
        }
    }

    private async scheduleUpdateNetworkStatus(nextUpdateInSeconds): Promise<void> {
        if (this.nextUpdateNetworkStatusScheduled) {
            return;
        }

        this.nextUpdateNetworkStatusScheduled = true;

        await delay(nextUpdateInSeconds * 1000);

        this.nextUpdateNetworkStatusScheduled = false;

        this.updateNetworkStatus();
    }

    private hasMinimumPeers(): boolean {
        if (this.config.ignoreMinimumNetworkReach) {
            this.logger.warn("Ignored the minimum network reach because the relay is in seed mode.");

            return true;
        }

        return Object.keys(this.storage.getPeers()).length >= app.resolveOptions("p2p").minimumNetworkReach;
    }

    private async populateSeedPeers(): Promise<any> {
        const peerList: IPeerData[] = app.getConfig().get("peers.list");

        if (!peerList) {
            app.forceExit("No seed peers defined in peers.json");
        }

        const peers: IPeerData[] = peerList.map(peer => {
            peer.version = app.getVersion();
            return peer;
        });

        return Promise.all(
            Object.values(peers).map((peer: P2P.IPeer) => {
                this.storage.forgetPeer(peer);

                return this.processor.validateAndAcceptPeer(peer, { seed: true, lessVerbose: true });
            }),
        );
    }
}
