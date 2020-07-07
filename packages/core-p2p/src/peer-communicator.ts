import { Container, Contracts, Enums, Providers, Utils } from "@arkecosystem/core-kernel";
import { Blocks, Interfaces, Managers, Transactions, Validation } from "@arkecosystem/crypto";
import dayjs from "dayjs";
import delay from "delay";

import { constants } from "./constants";
import { SocketErrors } from "./enums";
import { PeerPingTimeoutError, PeerStatusResponseError, PeerVerificationFailedError } from "./errors";
import { PeerVerifier } from "./peer-verifier";
import { RateLimiter } from "./rate-limiter";
import { replySchemas } from "./schemas";
import { buildRateLimiter, isValidVersion } from "./utils";

// todo: review the implementation
@Container.injectable()
export class PeerCommunicator implements Contracts.P2P.PeerCommunicator {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-p2p")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.PeerConnector)
    private readonly connector!: Contracts.P2P.PeerConnector;

    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly events!: Contracts.Kernel.EventDispatcher;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    private outgoingRateLimiter!: RateLimiter;

    public initialize(): void {
        this.outgoingRateLimiter = buildRateLimiter({
            // White listing anybody here means we would not throttle ourselves when sending
            // them requests, ie we could spam them.
            whitelist: [],
            remoteAccess: [],
            rateLimit: this.configuration.getOptional<boolean>("rateLimit", false),
        });
    }

    public async postBlock(peer: Contracts.P2P.Peer, block: Interfaces.IBlock) {
        const postBlockTimeout = 10000;
        return this.emit(
            peer,
            "p2p.peer.postBlock",
            {
                block: Blocks.Serializer.serializeWithTransactions({
                    ...block.data,
                    transactions: block.transactions.map((tx) => tx.data),
                }),
            },
            postBlockTimeout,
        );
    }

    public async postTransactions(peer: Contracts.P2P.Peer, transactions: Interfaces.ITransactionJson[]): Promise<any> {
        const postTransactionsTimeout = 10000;
        return this.emit(peer, "p2p.peer.postTransactions", { transactions }, postTransactionsTimeout);
    }

    // ! do not rely on parameter timeoutMsec as guarantee that ping method will resolve within it !
    // ! peerVerifier.checkState can take more time !
    // TODO refactor ?
    public async ping(peer: Contracts.P2P.Peer, timeoutMsec: number, force = false): Promise<any> {
        const deadline = new Date().getTime() + timeoutMsec;

        if (peer.recentlyPinged() && !force) {
            return undefined;
        }

        const getStatusTimeout = timeoutMsec < 5000 ? timeoutMsec : 5000;
        const pingResponse: Contracts.P2P.PeerPingResponse = await this.emit(
            peer,
            "p2p.peer.getStatus",
            {},
            getStatusTimeout,
        );

        if (!pingResponse) {
            throw new PeerStatusResponseError(peer.ip);
        }

        if (process.env.CORE_SKIP_PEER_STATE_VERIFICATION !== "true") {
            if (!this.validatePeerConfig(peer, pingResponse.config)) {
                throw new PeerVerificationFailedError();
            }

            const peerVerifier = this.app.resolve(PeerVerifier).initialize(this, peer);

            if (deadline <= new Date().getTime()) {
                throw new PeerPingTimeoutError(timeoutMsec);
            }

            peer.verificationResult = await peerVerifier.checkState(pingResponse.state, deadline);

            if (!peer.isVerified()) {
                throw new PeerVerificationFailedError();
            }
        }

        peer.lastPinged = dayjs();
        peer.state = pingResponse.state;
        peer.plugins = pingResponse.config.plugins;

        return pingResponse.state;
    }

    public async pingPorts(peer: Contracts.P2P.Peer): Promise<void> {
        await Promise.all(
            Object.entries(peer.plugins).map(async ([name, plugin]) => {
                try {
                    let valid: boolean = false;

                    const peerHostPort = `${peer.ip}:${plugin.port}`;

                    if (name.includes("core-api") || name.includes("core-wallet-api")) {
                        const { data, statusCode } = await Utils.http.get(
                            `http://${peerHostPort}/api/node/configuration`,
                        );

                        if (statusCode === 200) {
                            const ourNethash = Managers.configManager.get("network.nethash");
                            const hisNethash = data.data.nethash;
                            if (ourNethash === hisNethash) {
                                valid = true;
                            } else {
                                this.logger.warning(
                                    `Disconnecting from ${peerHostPort}: ` +
                                        `nethash mismatch: our=${ourNethash}, his=${hisNethash}.`,
                                );
                                this.events.dispatch("internal.p2p.disconnectPeer", { peer });
                            }
                        }
                    } else {
                        const { statusCode } = await Utils.http.get(`http://${peerHostPort}/`);
                        valid = statusCode === 200;
                    }

                    if (valid) {
                        peer.ports[name] = plugin.port;
                    }
                } catch (error) {
                    peer.ports[name] = -1;
                }
            }),
        );
    }

    public async getPeers(peer: Contracts.P2P.Peer): Promise<Contracts.P2P.PeerBroadcast[]> {
        this.logger.debug(`Fetching a fresh peer list from ${peer.url}`);

        const getPeersTimeout = 5000;
        return this.emit(peer, "p2p.peer.getPeers", {}, getPeersTimeout);
    }

    public async hasCommonBlocks(peer: Contracts.P2P.Peer, ids: string[], timeoutMsec?: number): Promise<any> {
        const getCommonBlocksTimeout = timeoutMsec && timeoutMsec < 5000 ? timeoutMsec : 5000;
        const body: any = await this.emit(peer, "p2p.peer.getCommonBlocks", { ids }, getCommonBlocksTimeout);

        if (!body || !body.common) {
            return false;
        }

        return body.common;
    }

    public async getPeerBlocks(
        peer: Contracts.P2P.Peer,
        {
            fromBlockHeight,
            blockLimit = constants.MAX_DOWNLOAD_BLOCKS,
            headersOnly,
        }: { fromBlockHeight: number; blockLimit?: number; headersOnly?: boolean },
    ): Promise<Interfaces.IBlockData[]> {
        const maxPayload = headersOnly ? blockLimit * constants.KILOBYTE : constants.DEFAULT_MAX_PAYLOAD;

        const peerBlocks = await this.emit(
            peer,
            "p2p.peer.getBlocks",
            {
                lastBlockHeight: fromBlockHeight,
                blockLimit,
                headersOnly,
                serialized: true,
            },
            this.configuration.getRequired<number>("getBlocksTimeout"),
            maxPayload,
        );

        if (!peerBlocks || !peerBlocks.length) {
            this.logger.debug(
                `Peer ${peer.ip} did not return any blocks via height ${fromBlockHeight.toLocaleString()}.`,
            );
            return [];
        }

        for (const block of peerBlocks) {
            if (!block.transactions) {
                continue;
            }

            block.transactions = block.transactions.map((transaction) => {
                const { data } = Transactions.TransactionFactory.fromBytesUnsafe(Buffer.from(transaction, "hex"));
                data.blockId = block.id;
                return data;
            });
        }

        return peerBlocks;
    }

    private validatePeerConfig(peer: Contracts.P2P.Peer, config: Contracts.P2P.PeerConfig): boolean {
        if (config.network.nethash !== Managers.configManager.get("network.nethash")) {
            return false;
        }

        peer.version = config.version;

        if (!isValidVersion(this.app, peer)) {
            return false;
        }

        return true;
    }

    private parseHeaders(peer: Contracts.P2P.Peer, response): void {
        if (response.headers && response.headers.height) {
            peer.state.height = +response.headers.height;
        }
    }

    private validateReply(peer: Contracts.P2P.Peer, reply: any, endpoint: string): boolean {
        const schema = replySchemas[endpoint];
        if (schema === undefined) {
            this.logger.error(`Can't validate reply from "${endpoint}": none of the predefined schemas matches.`);
            return false;
        }

        const { error } = Validation.validator.validate(schema, reply);
        if (error) {
            /* istanbul ignore else */
            if (process.env.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA) {
                this.logger.debug(`Got unexpected reply from ${peer.url}/${endpoint}: ${error}`);
            }

            return false;
        }

        return true;
    }

    private async emit(peer: Contracts.P2P.Peer, event: string, payload: any, timeout?: number, maxPayload?: number) {
        await this.throttle(peer, event);

        let response;
        try {
            this.connector.forgetError(peer);

            const timeBeforeSocketCall: number = new Date().getTime();

            maxPayload = maxPayload || 100 * constants.KILOBYTE; // 100KB by default, enough for most requests
            await this.connector.connect(peer, maxPayload);

            response = await this.connector.emit(peer, event, payload);

            peer.latency = new Date().getTime() - timeBeforeSocketCall;
            this.parseHeaders(peer, response.payload);

            if (!this.validateReply(peer, response.payload, event)) {
                const validationError = new Error(
                    `Response validation failed from peer ${peer.ip} : ${JSON.stringify(response.payload)}`,
                );
                validationError.name = SocketErrors.Validation;
                throw validationError;
            }
        } catch (e) {
            this.handleSocketError(peer, event, e);
            return undefined;
        }

        return response.payload;
    }

    private async throttle(peer: Contracts.P2P.Peer, event: string): Promise<void> {
        const msBeforeReCheck = 1000;
        while (await this.outgoingRateLimiter.hasExceededRateLimit(peer.ip, event)) {
            this.logger.debug(
                `Throttling outgoing requests to ${peer.ip}/${event} to avoid triggering their rate limit`,
            );
            await delay(msBeforeReCheck);
        }
    }

    private handleSocketError(peer: Contracts.P2P.Peer, event: string, error: Error): void {
        if (!error.name) {
            return;
        }

        this.connector.setError(peer, error.name);

        switch (error.name) {
            case SocketErrors.Validation:
                this.logger.debug(`Socket data validation error (peer ${peer.ip}) : ${error.message}`);
                break;
            case "Error":
                /* istanbul ignore else */
                if (process.env.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA) {
                    this.logger.debug(`Response error (peer ${peer.ip}/${event}) : ${error.message}`);
                }
                break;
            default:
                /* istanbul ignore else */
                if (process.env.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA) {
                    this.logger.debug(`Socket error (peer ${peer.ip}) : ${error.message}`);
                }
                this.events.dispatch(Enums.PeerEvent.Disconnect, { peer });
        }
    }
}
