/* tslint:disable:max-line-length */

import { app } from "@arkecosystem/core-container";
import { EventEmitter, Logger, P2P } from "@arkecosystem/core-interfaces";
import { dato } from "@faustbrian/dato";
import prettyMs from "pretty-ms";
import { SCClientSocket } from "socketcluster-client";
import { Peer } from "./peer";
import { PeerSuspension } from "./peer-suspension";
import { isValidPeer } from "./utils";

export class PeerProcessor implements P2P.IPeerProcessor {
    public server: any;
    public nextUpdateNetworkStatusScheduled: boolean;

    private readonly appConfig = app.getConfig();
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    private readonly emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

    private readonly communicator: P2P.IPeerCommunicator;
    private readonly connector: P2P.IPeerConnector;
    private readonly guard: P2P.IPeerGuard;
    private readonly storage: P2P.IPeerStorage;

    public constructor({
        communicator,
        connector,
        guard,
        storage,
    }: {
        communicator: P2P.IPeerCommunicator;
        connector: P2P.IPeerConnector;
        guard: P2P.IPeerGuard;
        storage: P2P.IPeerStorage;
    }) {
        this.communicator = communicator;
        this.connector = connector;
        this.guard = guard;
        this.storage = storage;
    }

    public async validateAndAcceptPeer(peer, options: P2P.IAcceptNewPeerOptions = {}): Promise<void> {
        if (this.validatePeer(peer, options)) {
            await this.acceptNewPeer(peer, options);
        }
    }

    public validatePeer(peer, options: P2P.IAcceptNewPeerOptions = {}): boolean {
        if (app.resolveOptions("p2p").disableDiscovery && !this.storage.hasPendingPeer(peer.ip)) {
            this.logger.warn(`Rejected ${peer.ip} because the relay is in non-discovery mode.`);
            return false;
        }

        if (!isValidPeer(peer) || this.hasPendingSuspension(peer) || this.storage.hasPendingPeer(peer.ip)) {
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

        if (this.storage.getSameSubnetPeers(peer.ip).length >= app.resolveOptions("p2p").maxSameSubnetPeers) {
            this.logger.warn(
                `Rejected ${peer.ip} because we are already at the ${
                    app.resolveOptions("p2p").maxSameSubnetPeers
                } limit for peers sharing the same /24 subnet.`,
            );
            return false;
        }

        return true;
    }

    public suspend(peer: P2P.IPeer, punishment?: P2P.IPunishment): void {
        if (this.storage.hasSuspendedPeer(peer.ip)) {
            return;
        }

        const whitelist = app.resolveOptions("p2p").whitelist;

        if (whitelist && whitelist.includes(peer.ip)) {
            return;
        }

        punishment = punishment || this.guard.analyze(peer);

        this.connector.disconnect(peer);

        if (!punishment) {
            return;
        }

        this.storage.setSuspendedPeer(new PeerSuspension(peer, punishment));
        this.storage.forgetPeer(peer);

        this.logger.debug(
            `Suspended ${peer.ip} for ${prettyMs(punishment.until.diff(dato()), {
                verbose: true,
            })} because of "${punishment.reason}"`,
        );
    }

    public async unsuspend(peer: P2P.IPeer): Promise<void> {
        if (!this.storage.hasSuspendedPeer(peer.ip)) {
            return;
        }

        const suspension: P2P.IPeerSuspension = this.storage.getSuspendedPeer(peer.ip);

        // Don't unsuspend critical offenders before the ban is expired.
        if (suspension.isCritical() && !suspension.hasExpired()) {
            return;
        }

        this.storage.forgetSuspendedPeer(suspension);

        const connection: SCClientSocket = this.connector.connection(peer);
        if (connection.getState() !== connection.OPEN) {
            // if after suspension peer socket is not open, we just "destroy" the socket connection
            // and we don't try to "accept" the peer again, so it will be definitively removed as there will be no reference to it
            connection.destroy();
        } else {
            await this.acceptNewPeer(peer);
        }
    }

    private async acceptNewPeer(peer, options: P2P.IAcceptNewPeerOptions = {}): Promise<void> {
        if (this.storage.getPeer(peer.ip)) {
            return;
        }

        const newPeer = new Peer(peer.ip, peer.port);
        newPeer.setHeaders(peer);

        try {
            this.storage.setPendingPeer(peer);

            await this.communicator.ping(newPeer, 3000);

            this.storage.setPeer(newPeer);

            if (!options.lessVerbose) {
                this.logger.debug(`Accepted new peer ${newPeer.ip}:${newPeer.port}`);
            }

            this.emitter.emit("peer.added", newPeer);
        } catch (error) {
            this.logger.debug(`Could not accept new peer ${newPeer.ip}:${newPeer.port}: ${error}`);
            this.suspend(newPeer);
        } finally {
            this.storage.forgetPendingPeer(peer);
        }

        return;
    }

    private hasPendingSuspension(peer: P2P.IPeer): boolean {
        const suspension: P2P.IPeerSuspension = this.storage.getSuspendedPeer(peer.ip);

        if (!suspension) {
            return false;
        }

        if (suspension.hasExpired()) {
            this.storage.forgetSuspendedPeer(suspension);

            return false;
        }

        if (!suspension.nextReminder || dato().isAfter(suspension.nextReminder)) {
            const untilDiff = suspension.punishment.until.diff(dato());

            this.logger.debug(
                `${peer.ip} still suspended for ${prettyMs(untilDiff, {
                    verbose: true,
                })} because of "${suspension.punishment.reason}".`,
            );

            suspension.nextReminder = dato().addMinutes(5);
        }

        return true;
    }
}
