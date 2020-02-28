import { Container, Contracts, Enums, Providers, Utils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";
import prettyMs from "pretty-ms";
import SocketCluster from "socketcluster";

import { NetworkState } from "./network-state";
import { PeerCommunicator } from "./peer-communicator";
import { PeerProcessor } from "./peer-processor";
import { RateLimiter } from "./rate-limiter";
import { buildRateLimiter, checkDNS, checkNTP } from "./utils";

// todo: review the implementation
@Container.injectable()
export class NetworkMonitor implements Contracts.P2P.NetworkMonitor {
    public server: SocketCluster | undefined;
    public config: any;
    public nextUpdateNetworkStatusScheduled: boolean | undefined;
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

    private initializing = true;

    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-p2p")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly emitter!: Contracts.Kernel.EventDispatcher;

    @Container.inject(Container.Identifiers.PeerCommunicator)
    private readonly communicator!: PeerCommunicator;

    @Container.inject(Container.Identifiers.PeerProcessor)
    private readonly processor!: PeerProcessor;

    @Container.inject(Container.Identifiers.PeerStorage)
    private readonly storage!: Contracts.P2P.PeerStorage;

    private rateLimiter!: RateLimiter;

    public initialize() {
        this.config = this.configuration.all(); // >_<
        this.rateLimiter = buildRateLimiter(this.config);
    }

    public getServer(): SocketCluster {
        // @ts-ignore
        return this.server;
    }

    public setServer(server: SocketCluster): void {
        this.server = server;
    }

    public async boot(): Promise<void> {
        await this.checkDNSConnectivity(this.config.dns);
        await this.checkNTPConnectivity(this.config.ntp);

        await this.populateSeedPeers();

        if (this.config.skipDiscovery) {
            this.logger.warning("Skipped peer discovery because the relay is in skip-discovery mode.");
        } else {
            await this.updateNetworkStatus(true);

            for (const [version, peers] of Object.entries(
                // @ts-ignore
                Utils.groupBy(this.storage.getPeers(), peer => peer.version),
            )) {
                this.logger.info(`Discovered ${Utils.pluralize("peer", peers.length, true)} with v${version}.`);
            }
        }

        // Give time to cooldown rate limits after peer verifier finished.
        await Utils.sleep(1000);

        this.initializing = false;
    }

    public dispose(): void {
        if (this.server) {
            this.server.removeAllListeners();
            this.server.destroy();
            this.server = undefined;
        }
    }

    public async updateNetworkStatus(initialRun?: boolean): Promise<void> {
        if (process.env.NODE_ENV === "test") {
            return;
        }

        if (this.config.networkStart) {
            this.coldStart = true;
            this.logger.warning("Entering cold start because the relay is in genesis-start mode.");
            return;
        }

        if (this.config.disableDiscovery) {
            this.logger.warning("Skipped peer discovery because the relay is in non-discovery mode.");
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
        const pingDelay = fast ? 1500 : this.config.verifyTimeout;

        if (peerCount) {
            peers = Utils.shuffle(peers).slice(0, peerCount);
            max = Math.min(peers.length, peerCount);
        }

        this.logger.info(`Checking ${max} peers`);
        const peerErrors = {};
        await Promise.all(
            peers.map(async peer => {
                try {
                    return await this.communicator.ping(peer, pingDelay, forcePing);
                } catch (error) {
                    unresponsivePeers++;

                    if (peerErrors[error]) {
                        peerErrors[error].push(peer);
                    } else {
                        peerErrors[error] = [peer];
                    }

                    this.emitter.dispatch("internal.p2p.disconnectPeer", { peer });
                    this.emitter.dispatch(Enums.PeerEvent.Removed, peer);

                    return undefined;
                }
            }),
        );

        for (const key of Object.keys(peerErrors)) {
            const peerCount = peerErrors[key].length;
            this.logger.debug(`Removed ${peerCount} ${Utils.pluralize("peers", peerCount)} because of "${key}"`);
        }

        if (this.initializing) {
            this.logger.info(`${max - unresponsivePeers} of ${max} peers on the network are responsive`);
            this.logger.info(`Median Network Height: ${this.getNetworkHeight().toLocaleString()}`);
        }
    }

    public async discoverPeers(pingAll?: boolean): Promise<boolean> {
        const maxPeersPerPeer = 50;
        const ownPeers: Contracts.P2P.Peer[] = this.storage.getPeers();
        const theirPeers: Contracts.P2P.Peer[] = Object.values(
            (
                await Promise.all(
                    Utils.shuffle(this.storage.getPeers())
                        .slice(0, 8)
                        .map(async (peer: Contracts.P2P.Peer) => {
                            try {
                                const hisPeers = await this.communicator.getPeers(peer);
                                return hisPeers || [];
                            } catch (error) {
                                this.logger.debug(`Failed to get peers from ${peer.ip}: ${error.message}`);
                                return [];
                            }
                        }),
                )
            )
                .map(peers =>
                    Utils.shuffle(peers)
                        .slice(0, maxPeersPerPeer)
                        .reduce(
                            // @ts-ignore - rework this so TS stops throwing errors
                            (acc: object, curr: Contracts.P2P.Peer) => ({
                                ...acc,
                                ...{ [curr.ip]: curr },
                            }),
                            {},
                        ),
                )
                .reduce((acc: object, curr: Contracts.P2P.Peer) => ({ ...acc, ...curr }), {}),
        );

        if (pingAll || !this.hasMinimumPeers() || ownPeers.length < theirPeers.length * 0.75) {
            await Promise.all(theirPeers.map(p => this.processor.validateAndAcceptPeer(p, { lessVerbose: true })));
            this.pingPeerPorts(pingAll);

            return true;
        }

        this.pingPeerPorts();

        return false;
    }

    public async getRateLimitStatus(ip: string, endpoint?: string): Promise<Contracts.P2P.IRateLimitStatus> {
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
            .sort((a, b) => {
                Utils.assert.defined<string>(a);
                Utils.assert.defined<string>(b);

                return a - b;
            });

        return medians[Math.floor(medians.length / 2)] || 0;
    }

    public async getNetworkState(): Promise<Contracts.P2P.NetworkState> {
        await this.cleansePeers({ fast: true, forcePing: true });

        return NetworkState.analyze(this, this.storage);
    }

    public async refreshPeersAfterFork(): Promise<void> {
        this.logger.info(`Refreshing ${this.storage.getPeers().length} peers after fork.`);

        await this.cleansePeers({ forcePing: true });
    }

    public async checkNetworkHealth(): Promise<Contracts.P2P.NetworkStatus> {
        await this.discoverPeers(true);
        await this.cleansePeers({ forcePing: true });

        const lastBlock: Interfaces.IBlock = this.app
            .get<Contracts.State.StateStore>(Container.Identifiers.StateStore)
            .getLastBlock();

        const allPeers: Contracts.P2P.Peer[] = this.storage.getPeers();

        if (!allPeers.length) {
            this.logger.info("No peers available.");

            return { forked: false };
        }

        const forkedPeers: Contracts.P2P.Peer[] = allPeers.filter((peer: Contracts.P2P.Peer) => peer.isForked());
        const majorityOnOurChain: boolean = forkedPeers.length / allPeers.length < 0.5;

        if (majorityOnOurChain) {
            this.logger.info("The majority of peers is not forked. No need to rollback.");
            return { forked: false };
        }

        const groupedByCommonHeight = Utils.groupBy(allPeers, peer => peer.verification.highestCommonHeight);

        const groupedByLength = Utils.groupBy(Object.values(groupedByCommonHeight), peer => peer.length);

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
        maxParallelDownloads = 10,
    ): Promise<Interfaces.IBlockData[]> {
        const peersAll: Contracts.P2P.Peer[] = this.storage.getPeers();

        if (peersAll.length === 0) {
            this.logger.error(`Could not download blocks: we have 0 peers`);
            return [];
        }

        const peersNotForked: Contracts.P2P.Peer[] = Utils.shuffle(peersAll.filter(peer => !peer.isForked()));

        if (peersNotForked.length === 0) {
            this.logger.error(
                `Could not download blocks: We have ${peersAll.length} peer(s) but all ` +
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
        const downloadResults: any = [];
        let someJobFailed: boolean = false;
        let chunksHumanReadable: string = "";

        for (let i = 0; i < chunksToDownload; i++) {
            const height: number = fromBlockHeight + chunkSize * i;
            const isLastChunk: boolean = i === chunksToDownload - 1;
            const blocksRange: string = `[${height + 1}, ${isLastChunk ? ".." : height + chunkSize}]`;

            //@ts-ignore
            downloadJobs.push(async () => {
                if (this.downloadedChunksCache[height] !== undefined) {
                    downloadResults[i] = this.downloadedChunksCache[height];
                    // Remove it from the cache so that it does not get served many times
                    // from the cache. In case of network reorganization or downloading
                    // flawed chunks we want to re-download from another peer.
                    delete this.downloadedChunksCache[height];
                    return;
                }

                let blocks!: Interfaces.IBlockData[];
                let peer: Contracts.P2P.Peer;
                let peerPrint!: string;

                // As a first peer to try, pick such a peer that different jobs use different peers.
                // If that peer fails then pick randomly from the remaining peers that have not
                // been first-attempt for any job.
                const peersToTry = [peersNotForked[i], ...Utils.shuffle(peersNotForked.slice(chunksToDownload))];

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
                    }
                }

                someJobFailed = true;
                throw new Error(
                    `Could not download blocks ${blocksRange} from any of ${peersToTry.length} ` +
                        `peer(s). Last attempt returned ${blocks.length} block(s) from peer ${peerPrint}.`,
                );
            });

            if (chunksHumanReadable.length > 0) {
                chunksHumanReadable += ", ";
            }
            chunksHumanReadable += blocksRange;
        }

        this.logger.debug(`Downloading blocks in chunks: ${chunksHumanReadable}`);
        let firstFailureMessage!: string;

        try {
            // Convert the array of AsyncFunction to an array of Promise by calling the functions.
            // @ts-ignore
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
        const blockchain = this.app.get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService);

        if (!blockchain) {
            this.logger.info(
                `Skipping broadcast of block ${block.data.height.toLocaleString()} as blockchain is not ready`,
            );
            return;
        }

        let blockPing = blockchain.getBlockPing();
        let peers: Contracts.P2P.Peer[] = this.storage.getPeers();

        if (blockPing && blockPing.block.id === block.data.id) {
            // wait a bit before broadcasting if a bit early
            const diff = blockPing.last - blockPing.first;
            const maxHop = 4;
            let broadcastQuota: number = (maxHop - blockPing.count) / maxHop;

            if (diff < 500 && broadcastQuota > 0) {
                await Utils.sleep(500 - diff);

                blockPing = blockchain.getBlockPing();

                // got aleady a new block, no broadcast
                if (blockPing.block.id !== block.data.id) {
                    return;
                }

                broadcastQuota = (maxHop - blockPing.count) / maxHop;
            }

            peers = broadcastQuota <= 0 ? [] : Utils.shuffle(peers).slice(0, Math.ceil(broadcastQuota * peers.length));
            // select a portion of our peers according to quota calculated before
        }

        this.logger.info(
            `Broadcasting block ${block.data.height.toLocaleString()} to ${Utils.pluralize(
                "peer",
                peers.length,
                true,
            )}`,
        );

        await Promise.all(peers.map(peer => this.communicator.postBlock(peer, block)));
    }

    private async pingPeerPorts(pingAll?: boolean): Promise<void> {
        let peers = this.storage.getPeers();
        if (!pingAll) {
            peers = Utils.shuffle(peers).slice(0, Math.floor(peers.length / 2));
        }

        this.logger.debug(`Checking ports of ${Utils.pluralize("peer", peers.length, true)}.`);

        Promise.all(
            peers.map(async peer => {
                try {
                    return await this.communicator.pingPorts(peer);
                } catch (error) {
                    return undefined;
                }
            }),
        );
    }

    private async checkDNSConnectivity(options): Promise<void> {
        try {
            const host = await checkDNS(this.app, options);

            this.logger.info(`Your network connectivity has been verified by ${host}`);
        } catch (error) {
            this.logger.error(error.message);
        }
    }

    private async checkNTPConnectivity(options): Promise<void> {
        try {
            const { host, time } = await checkNTP(this.app, options);

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

        await Utils.sleep(nextUpdateInSeconds * 1000);

        this.nextUpdateNetworkStatusScheduled = false;

        this.updateNetworkStatus();
    }

    private hasMinimumPeers(): boolean {
        if (this.config.ignoreMinimumNetworkReach) {
            this.logger.warning("Ignored the minimum network reach because the relay is in seed mode.");

            return true;
        }

        return Object.keys(this.storage.getPeers()).length >= this.config.minimumNetworkReach;
    }

    private async populateSeedPeers(): Promise<any> {
        const peerList: Contracts.P2P.PeerData[] = this.app.config("peers").list;

        if (!peerList) {
            this.app.terminate("No seed peers defined in peers.json");
        }

        const peers: Contracts.P2P.PeerData[] = peerList.map(peer => {
            peer.version = this.app.version();
            return peer;
        });

        return Promise.all(
            // @ts-ignore
            Object.values(peers).map((peer: Contracts.P2P.Peer) => {
                this.storage.forgetPeer(peer);

                return this.processor.validateAndAcceptPeer(peer, { seed: true, lessVerbose: true });
            }),
        );
    }
}
