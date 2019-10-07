import { app, Container, Contracts, Enums, Utils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";
import delay from "delay";
import prettyMs from "pretty-ms";
import SocketCluster from "socketcluster";

import { PeerData } from "./interfaces";
import { NetworkState } from "./network-state";
import { checkDNS, checkNTP } from "./utils";

// todo: review the implementation
@Container.injectable()
export class NetworkMonitor implements Contracts.P2P.NetworkMonitor {
    public server: SocketCluster;
    public config: any;
    public nextUpdateNetworkStatusScheduled: boolean;
    private initializing = true;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger: Contracts.Kernel.Log.Logger;

    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly emitter: Contracts.Kernel.Events.EventDispatcher;

    @Container.inject(Container.Identifiers.PeerCommunicator)
    private readonly communicator: Contracts.P2P.PeerCommunicator;

    @Container.inject(Container.Identifiers.PeerProcessor)
    private readonly processor: Contracts.P2P.PeerProcessor;

    @Container.inject(Container.Identifiers.PeerStorage)
    private readonly storage: Contracts.P2P.PeerStorage;

    public constructor() {
        this.config = app.get("p2p.options");
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
            this.logger.warning("Skipped peer discovery because the relay is in skip-discovery mode.");
        } else {
            await this.updateNetworkStatus(true);

            for (const [version, peers] of Object.entries(
                Utils.groupBy(this.storage.getPeers(), peer => peer.version),
            )) {
                this.logger.info(`Discovered ${Utils.pluralize("peer", peers.length, true)} with v${version}.`);
            }
        }

        // Give time to cooldown rate limits after peer verifier finished.
        await delay(1000);

        this.initializing = false;
    }

    public async updateNetworkStatus(initialRun?: boolean): Promise<void> {
        if (process.env.CORE_ENV === "test" || process.env.NODE_ENV === "test") {
            return;
        }

        if (this.config.networkStart) {
            this.logger.warning("Skipped peer discovery because the relay is in genesis-start mode.");
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
        const pingDelay = fast ? 1500 : app.get<any>("p2p.options").verifyTimeout;

        if (peerCount) {
            peers = Utils.shuffle(peers).slice(0, peerCount);
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

                    this.emitter.dispatch(Enums.Events.State.PeerRemoved, peer);

                    this.storage.forgetPeer(peer);

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

    public async discoverPeers(initialRun?: boolean): Promise<boolean> {
        const maxPeersPerPeer = 50;
        const ownPeers: Contracts.P2P.Peer[] = this.storage.getPeers();
        const theirPeers: Contracts.P2P.Peer[] = Object.values(
            (await Promise.all(
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
            ))
                .map(peers =>
                    Utils.shuffle(peers)
                        .slice(0, maxPeersPerPeer)
                        .reduce((acc, curr: Contracts.P2P.Peer) => ({ ...acc, ...{ [curr.ip]: curr } }), {}),
                )
                .reduce((acc, curr) => ({ ...acc, ...curr }), {}),
        );

        if (initialRun || !this.hasMinimumPeers() || ownPeers.length < theirPeers.length * 0.5) {
            await Promise.all(theirPeers.map(p => this.processor.validateAndAcceptPeer(p, { lessVerbose: true })));
            this.pingPeerPorts(initialRun);

            return true;
        }

        this.pingPeerPorts();

        return false;
    }

    public getNetworkHeight(): number {
        const medians = this.storage
            .getPeers()
            .filter(peer => peer.state.height)
            .map(peer => peer.state.height)
            .sort((a, b) => a - b);

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
        await this.cleansePeers({ forcePing: true });

        const lastBlock = app.get<Contracts.State.StateStore>(Container.Identifiers.StateStore).getLastBlock();

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

    public async syncWithNetwork(fromBlockHeight: number, maxParallelDownloads = 25): Promise<Interfaces.IBlockData[]> {
        try {
            const peersAll: Contracts.P2P.Peer[] = this.storage.getPeers();
            const peersFiltered: Contracts.P2P.Peer[] = peersAll.filter(peer => !peer.isForked());

            if (peersFiltered.length === 0) {
                this.logger.error(
                    `Could not download blocks: Failed to pick a random peer from our list of ${peersAll.length} peers: all are either banned or on a different chain than us`,
                );

                return [];
            }

            const networkHeight: number = this.getNetworkHeight();

            if (!networkHeight || networkHeight <= fromBlockHeight) {
                // networkHeight is what we believe network height is, so even if it is <= our height, we download blocks
                return this.communicator.downloadBlocks(Utils.sample(peersFiltered), fromBlockHeight);
            }

            const chunkSize = 400;
            const chunksMissingToSync: number = Math.ceil((networkHeight - fromBlockHeight) / chunkSize);
            const chunksToDownload: number = Math.min(chunksMissingToSync, peersFiltered.length, maxParallelDownloads);

            return (await Promise.all(
                Utils.shuffle(peersFiltered)
                    .slice(0, chunksToDownload)
                    .map(async (peer: Contracts.P2P.Peer, index) => {
                        const height: number = fromBlockHeight + chunkSize * index;
                        const peersToTry: Contracts.P2P.Peer[] = [
                            peer,
                            Utils.sample(peersFiltered),
                            Utils.sample(peersFiltered),
                        ]; // 2 "fallback" peers to download from if 1st one failed

                        let blocks: Interfaces.IBlockData[];
                        for (const peerToDownloadFrom of peersToTry) {
                            blocks = await this.communicator.downloadBlocks(peerToDownloadFrom, height);

                            if (blocks.length > 0) {
                                return blocks;
                            }
                        }

                        return blocks;
                    }),
            )).reduce((acc, curr) => [...acc, ...(curr || [])], []);
        } catch (error) {
            this.logger.error(`Could not download blocks: ${error.message}`);

            return this.syncWithNetwork(fromBlockHeight, Math.ceil(maxParallelDownloads / 2)); // retry with half the parallel downloads
        }
    }

    public async broadcastBlock(block: Interfaces.IBlock): Promise<void> {
        const blockchain = app.get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService);

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
                await delay(500 - diff);

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

        await Promise.all(peers.map(peer => this.communicator.postBlock(peer, block.toJson())));
    }

    public async broadcastTransactions(transactions: Interfaces.ITransaction[]): Promise<any> {
        const peers: Contracts.P2P.Peer[] = Utils.take(
            Utils.shuffle(this.storage.getPeers()),
            app.get<any>("p2p.options").maxPeersBroadcast,
        );

        this.logger.debug(
            `Broadcasting ${Utils.pluralize("transaction", transactions.length, true)} to ${Utils.pluralize(
                "peer",
                peers.length,
                true,
            )}`,
        );

        const transactionsBroadcast: Interfaces.ITransactionJson[] = transactions.map(transaction =>
            transaction.toJson(),
        );

        return Promise.all(
            peers.map((peer: Contracts.P2P.Peer) => this.communicator.postTransactions(peer, transactionsBroadcast)),
        );
    }

    private async pingPeerPorts(initialRun?: boolean): Promise<void> {
        let peers = this.storage.getPeers();
        if (!initialRun) {
            peers = Utils.shuffle(peers).slice(0, Math.floor(peers.length / 2));
        }

        this.logger.debug(`Checking ports of ${Utils.pluralize("peer", peers.length, true)}.`);

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
            this.logger.warning("Ignored the minimum network reach because the relay is in seed mode.");

            return true;
        }

        return Object.keys(this.storage.getPeers()).length >= app.get<any>("p2p.options").minimumNetworkReach;
    }

    private async populateSeedPeers(): Promise<any> {
        const peerList: PeerData[] = app.config("peers").list;

        if (!peerList) {
            app.terminate("No seed peers defined in peers.json");
        }

        const peers: PeerData[] = peerList.map(peer => {
            peer.version = app.version();
            return peer;
        });

        return Promise.all(
            Object.values(peers).map((peer: Contracts.P2P.Peer) => {
                this.storage.forgetPeer(peer);

                return this.processor.validateAndAcceptPeer(peer, { seed: true, lessVerbose: true });
            }),
        );
    }
}
