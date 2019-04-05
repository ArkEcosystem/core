/* tslint:disable:max-line-length */

import { app } from "@arkecosystem/core-container";
import { EventEmitter, Logger, P2P } from "@arkecosystem/core-interfaces";
import { dato } from "@faustbrian/dato";
import prettyMs from "pretty-ms";
import { SCClientSocket } from "socketcluster-client";
import { config as localConfig } from "./config";
import { PeerStatusResponseError } from "./errors";
import { Peer } from "./peer";
import { isValidPeer } from "./utils";

export class PeerProcessor implements P2P.IPeerProcessor {
    public server: any;
    public nextUpdateNetworkStatusScheduled: boolean;

    private readonly appConfig = app.getConfig();
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    private readonly emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

    constructor(
        private readonly storage: P2P.IPeerStorage,
        private readonly guard: P2P.IPeerGuard,
        private readonly connector: P2P.IPeerConnector,
    ) {}

    public async validateAndAcceptPeer(peer, options: P2P.IAcceptNewPeerOptions = {}): Promise<void> {
        if (this.validatePeer(peer, options)) {
            await this.acceptNewPeer(peer, options);
        }
    }

    public validatePeer(peer, options: P2P.IAcceptNewPeerOptions = {}): boolean {
        if (localConfig.get("disableDiscovery") && !this.storage.hasPendingPeer(peer.ip)) {
            this.logger.warn(`Rejected ${peer.ip} because the relay is in non-discovery mode.`);
            return false;
        }

        if (!isValidPeer(peer) || this.isSuspended(peer) || this.storage.hasPendingPeer(peer.ip)) {
            return false;
        }

        if (!this.guard.isValidVersion(peer) && !this.guard.isWhitelisted(peer)) {
            const minimumVersions: string[] = localConfig.get("minimumVersions");

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

    public async acceptNewPeer(peer, options: P2P.IAcceptNewPeerOptions = {}): Promise<void> {
        if (this.storage.getPeer(peer.ip)) {
            return;
        }

        const newPeer = new Peer(peer.ip, peer.port);
        newPeer.setHeaders(peer);

        try {
            this.storage.setPendingPeer(peer);

            // @TODO: ping via PeerCommunicator
            // await newPeer.ping(3000);

            this.storage.setPeer(newPeer);

            if (!options.lessVerbose) {
                this.logger.debug(`Accepted new peer ${newPeer.ip}:${newPeer.port}`);
            }

            this.emitter.emit("peer.added", newPeer);
        } catch (error) {
            if (error instanceof PeerStatusResponseError) {
                this.logger.debug(error.message);
            } else {
                this.logger.debug(`Could not accept new peer ${newPeer.ip}:${newPeer.port}: ${error}`);
                this.suspend(newPeer);
            }
        } finally {
            this.storage.forgetPendingPeer(peer);
        }

        return;
    }

    public suspend(peer: P2P.IPeer, punishment?: P2P.IPunishment): void {
        if (this.storage.hasSuspendedPeer(peer.ip)) {
            return;
        }

        const whitelist = localConfig.get("whitelist");

        if (whitelist && whitelist.includes(peer.ip)) {
            return;
        }

        punishment = punishment || this.guard.analyze(peer);

        this.storage.setSuspendedPeer({ peer, punishment });
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

        const suspension = this.storage.getSuspendedPeer(peer.ip);

        // Don't unsuspend critical offenders before the ban is expired.
        if (suspension.punishment.critical && dato().isBefore(suspension.punishment.until)) {
            return;
        }

        this.storage.forgetSuspendedPeer(peer);
        delete peer.nextSuspensionReminder;

        const connection: SCClientSocket = this.connector.connection(peer);
        if (connection.getState() !== connection.OPEN) {
            // if after suspension peer socket is not open, we just "destroy" the socket connection
            // and we don't try to "accept" the peer again, so it will be definitively removed as there will be no reference to it
            connection.destroy();
        } else {
            await this.acceptNewPeer(peer);
        }
    }

    // @TODO: review this and move into an appropriate class
    public async resetSuspendedPeers(): Promise<void> {
        this.logger.info("Clearing suspended peers.");

        await Promise.all(this.storage.getSuspendedPeers().map(suspension => this.unsuspend(suspension.peer)));
    }

    // @TODO: review this and move into an appropriate class
    public isSuspended(peer: P2P.IPeer): boolean {
        const suspendedPeer = this.storage.getSuspendedPeer(peer.ip);

        if (suspendedPeer && dato().isBefore(suspendedPeer.punishment.until)) {
            const { nextSuspensionReminder } = suspendedPeer;

            if (!nextSuspensionReminder || dato().isAfter(nextSuspensionReminder)) {
                const untilDiff = suspendedPeer.punishment.until.diff(dato());

                this.logger.debug(
                    `${peer.ip} still suspended for ${prettyMs(untilDiff, {
                        verbose: true,
                    })} because of "${suspendedPeer.punishment.reason}".`,
                );

                suspendedPeer.nextSuspensionReminder = dato().addMinutes(5);
            }

            return true;
        }

        if (suspendedPeer) {
            this.storage.forgetSuspendedPeer(suspendedPeer.peer);
        }

        return false;
    }
}
