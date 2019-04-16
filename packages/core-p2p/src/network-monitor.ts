/* tslint:disable:max-line-length */

import { app } from "@arkecosystem/core-container";
import { Blockchain, EventEmitter, Logger, P2P } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
import { dato, Dato } from "@faustbrian/dato";
import delay from "delay";
import groupBy from "lodash.groupby";
import sample from "lodash.sample";
import shuffle from "lodash.shuffle";
import take from "lodash.take";
import pluralize from "pluralize";
import prettyMs from "pretty-ms";
import SocketCluster from "socketcluster";
import { IPeerData } from "./interfaces";
import { NetworkState } from "./network-state";
import { checkDNS, checkNTP, restorePeers } from "./utils";

export class NetworkMonitor implements P2P.INetworkMonitor {
    public server: SocketCluster;
    public config: any;
    public nextUpdateNetworkStatusScheduled: boolean;
    private initializing: boolean = true;
    private coldStartPeriod: Dato;

    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    private readonly emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

    private readonly communicator: P2P.IPeerCommunicator;
    private readonly processor: P2P.IPeerProcessor;
    private readonly storage: P2P.IPeerStorage;

    public constructor({
        communicator,
        processor,
        storage,
    }: {
        communicator: P2P.IPeerCommunicator;
        processor: P2P.IPeerProcessor;
        storage: P2P.IPeerStorage;
    }) {
        this.communicator = communicator;
        this.processor = processor;
        this.storage = storage;

        this.coldStartPeriod = dato().addSeconds(app.resolveOptions("p2p").coldStart);
    }

    public getServer(): SocketCluster {
        return this.server;
    }

    public setServer(server: SocketCluster): void {
        this.server = server;
    }

    public isColdStartActive(): boolean {
        if (process.env.CORE_SKIP_COLD_START) {
            return false;
        }

        return this.coldStartPeriod.isAfter(dato());
    }

    public async start(options): Promise<this> {
        this.config = options;

        await this.checkDNSConnectivity(options.dns);
        await this.checkNTPConnectivity(options.ntp);

        await this.populateSeedPeers();

        if (this.config.skipDiscovery) {
            this.logger.warn("Skipped peer discovery because the relay is in skip-discovery mode.");
        } else {
            await this.updateNetworkStatus(options.networkStart);

            for (const [version, peers] of Object.entries(groupBy(this.storage.getPeers(), "version"))) {
                this.logger.info(`Discovered ${pluralize("peer", peers.length, true)} with v${version}.`);
            }
        }

        this.initializing = false;

        return this;
    }

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

    public async cleanPeers(fast: boolean = false, forcePing: boolean = false): Promise<void> {
        const peers = this.storage.getPeers();
        let unresponsivePeers = 0;
        const pingDelay = fast ? 1500 : app.resolveOptions("p2p").globalTimeout;
        const max = peers.length;

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

                    this.emitter.emit("peer.removed", peer);

                    this.storage.forgetPeer(peer);

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
        }
    }

    public async discoverPeers(): Promise<void> {
        const queryAtLeastNPeers = 4;
        let queriedPeers = 0;

        const shuffledPeers = shuffle(this.storage.getPeers());

        for (const peer of shuffledPeers) {
            try {
                const hisPeers = await this.communicator.getPeers(peer);
                queriedPeers++;
                await Promise.all(hisPeers.map(p => this.processor.validateAndAcceptPeer(p, { lessVerbose: true })));
            } catch (error) {
                // Just try with the next peer from shuffledPeers.
            }

            if (this.hasMinimumPeers() && queriedPeers >= queryAtLeastNPeers) {
                return;
            }
        }
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
        if (!this.isColdStartActive()) {
            await this.cleanPeers(true, true);
        }

        return NetworkState.analyze(this, this.storage);
    }

    public async refreshPeersAfterFork(): Promise<void> {
        this.logger.info(`Refreshing ${this.storage.getPeers().length} peers after fork.`);

        // Reset all peers, except peers banned because of causing a fork.
        await this.cleanPeers(false, true);
        await this.resetSuspendedPeers();

        // Ban peer who caused the fork
        const forkedBlock = app.resolve("state").forkedBlock;
        if (forkedBlock) {
            this.processor.suspend(forkedBlock.ip);
        }
    }

    public async checkNetworkHealth(): Promise<P2P.INetworkStatus> {
        if (!this.isColdStartActive()) {
            await this.cleanPeers(false, true);
            await this.resetSuspendedPeers();
        }

        const lastBlock = app.resolve("state").getLastBlock();

        const allPeers: P2P.IPeer[] = [
            ...this.storage.getPeers(),
            ...this.storage
                .getSuspendedPeers()
                .map((suspendedPeer: P2P.IPeerSuspension) => suspendedPeer.peer)
                .filter(peer => peer.isVerified()),
        ];

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
        return { forked: true, blocksToRollback: lastBlock.data.height - highestCommonHeight };
    }

    public async syncWithNetwork(fromBlockHeight: number): Promise<Interfaces.IBlockData[]> {
        try {
            const peersAll: P2P.IPeer[] = this.storage.getPeers();
            const peersFiltered: P2P.IPeer[] = peersAll.filter(
                peer => !this.storage.hasSuspendedPeer(peer.ip) && !peer.isForked(),
            );

            if (peersFiltered.length === 0) {
                this.logger.error(
                    `Could not download blocks: Failed to pick a random peer from our list of ${
                        peersAll.length
                    } peers: all are either banned or on a different chain than us`,
                );

                return [];
            }

            return this.communicator.downloadBlocks(sample(peersFiltered), fromBlockHeight);
        } catch (error) {
            this.logger.error(`Could not download blocks: ${error.message}`);

            return this.syncWithNetwork(fromBlockHeight);
        }
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
            let broadcastQuota = (maxHop - blockPing.count) / maxHop;

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

        await Promise.all(peers.map(peer => this.communicator.postBlock(peer, block.toJson())));
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

    public async resetSuspendedPeers(): Promise<void> {
        this.logger.info("Clearing suspended peers.");

        await Promise.all(
            this.storage.getSuspendedPeers().map(suspension => this.processor.unsuspend(suspension.peer)),
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

        this.updateNetworkStatus(this.config.networkStart);
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

        const peerCache: IPeerData[] = restorePeers();
        if (peerCache) {
            peerCache.forEach(peerA => {
                if (!peers.some(peerB => peerA.ip === peerB.ip && peerA.port === peerB.port)) {
                    peers.push(peerA);
                }
            });
        }

        return Promise.all(
            Object.values(peers).map((peer: P2P.IPeer) => {
                this.storage.forgetPeer(peer);

                return this.processor.validateAndAcceptPeer(peer, { seed: true, lessVerbose: true });
            }),
        );
    }
}
