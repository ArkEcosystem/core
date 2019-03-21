import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { dato, Dato } from "@faustbrian/dato";
import head from "lodash/head";
import sumBy from "lodash/sumBy";
import prettyMs from "pretty-ms";
import semver from "semver";

import { config as localConfig } from "../config";
import { SocketErrors } from "../socket-server/constants";
import { offences } from "./offences";

export interface ISuspension {
    peer: any;
    reason: string;
    until: Dato;
    nextSuspensionReminder?: Dato;
}

export class Guard {
    public readonly suspensions: { [ip: string]: ISuspension };
    public config: any;
    public monitor: any;

    private readonly appConfig = app.getConfig();
    private readonly logger = app.resolvePlugin<Logger.ILogger>("logger");

    /**
     * Create a new guard instance.
     */
    constructor() {
        this.suspensions = {};
        this.config = localConfig;
    }

    /**
     * Initialise a new guard.
     * @param {IMonitor} monitor
     */
    public init(monitor) {
        this.monitor = monitor;

        return this;
    }

    /**
     * Get a list of all suspended peers.
     * @return {Object}
     */
    public all() {
        return this.suspensions;
    }

    /**
     * Get the suspended peer for the give IP.
     * @return {Object}
     */
    public get(ip) {
        return this.suspensions[ip];
    }

    /**
     * Suspends a peer unless whitelisted.
     * @param {Peer} peer
     */
    public suspend(peer) {
        const whitelist = this.config.get("whitelist");
        if (whitelist && whitelist.includes(peer.ip)) {
            return;
        }

        if (peer.offences.length > 0) {
            if (dato().isAfter((head(peer.offences) as any).until)) {
                peer.offences = [];
            }
        }

        const offence = this.__determineOffence(peer);

        peer.offences.push(offence);

        this.suspensions[peer.ip] = {
            peer,
            until: offence.until,
            reason: offence.reason,
        };

        this.monitor.removePeer(peer);
    }

    /**
     * Remove a suspended peer.
     * @param {Peer} peer
     * @return {void}
     */
    public async unsuspend(peer) {
        if (!this.suspensions[peer.ip]) {
            return;
        }

        // Don't unsuspend critical offenders before the ban is expired.
        if (peer.offences.some(offence => offence.critical)) {
            if (dato().isBefore(this.suspensions[peer.ip].until)) {
                return;
            }
        }

        delete this.suspensions[peer.ip];
        delete peer.nextSuspensionReminder;

        if (peer.socket.getState() !== peer.socket.OPEN) {
            // if after suspension peer socket is not open, we just "destroy" the socket connection
            // and we don't try to "accept" the peer again, so it will be definitively removed as there will be no reference to it
            peer.socket.destroy();
        } else {
            await this.monitor.acceptNewPeer(peer);
        }
    }

    /**
     * Reset suspended peers
     * @return {void}
     */
    public async resetSuspendedPeers() {
        this.logger.info("Clearing suspended peers.");
        await Promise.all(Object.values(this.suspensions).map(suspension => this.unsuspend(suspension.peer)));
    }

    /**
     * Determine if peer is suspended or not.
     * @param  {Peer} peer
     * @return {Boolean}
     */
    public isSuspended(peer) {
        const suspendedPeer = this.get(peer.ip);

        if (suspendedPeer && dato().isBefore(suspendedPeer.until)) {
            const nextSuspensionReminder = suspendedPeer.nextSuspensionReminder;

            if (!nextSuspensionReminder || dato().isAfter(nextSuspensionReminder)) {
                // @ts-ignore
                const untilDiff = suspendedPeer.until.diff(dato());

                this.logger.debug(
                    `${peer.ip} still suspended for ${prettyMs(untilDiff, {
                        verbose: true,
                    })} because of "${suspendedPeer.reason}".`,
                );

                suspendedPeer.nextSuspensionReminder = dato().addMinutes(5);
            }

            return true;
        }

        if (suspendedPeer) {
            delete this.suspensions[peer.ip];
        }

        return false;
    }

    /**
     * Determine if the peer is whitelisted.
     * @param  {Peer}  peer
     * @return {Boolean}
     */
    public isWhitelisted(peer) {
        return this.config.get("whitelist").includes(peer.ip);
    }

    /**
     * Determine if the peer is blacklisted.
     * @param  {Peer}  peer
     * @return {Boolean}
     */
    public isBlacklisted(peer) {
        return this.config.get("blacklist").includes(peer.ip);
    }

    /**
     * Determine if the peer is within the version constraints.
     * @param  {Peer}  peer
     * @return {Boolean}
     */
    public isValidVersion(peer) {
        const version = peer.version || (peer.headers && peer.headers.version);
        if (!semver.valid(version)) {
            return false;
        }

        return this.config
            .get("minimumVersions")
            .some((minimumVersion: string) => semver.satisfies(version, minimumVersion));
    }

    /**
     * Determine if the peer is on the right network.
     * @param  {Peer}  peer
     * @return {Boolean}
     */
    public isValidNetwork(peer) {
        const nethash = peer.nethash || (peer.headers && peer.headers.nethash);
        return nethash === this.appConfig.get("network.nethash");
    }

    /**
     * Determine if the peer has a valid port.
     * @param  {Peer}  peer
     * @return {Boolean}
     */
    public isValidPort(peer) {
        return peer.port === this.config.get("port");
    }

    /**
     * Decide if the given peer is a repeat offender.
     * @param  {Object}  peer
     * @return {Boolean}
     */
    public isRepeatOffender(peer) {
        return sumBy(peer.offences, "weight") >= 150;
    }

    /**
     * Decide for how long the peer should be banned.
     * @param  {Peer}  peer
     * @return {Object}
     */
    public __determineOffence(peer) {
        if (this.isBlacklisted(peer)) {
            return this.__determinePunishment(peer, offences.BLACKLISTED);
        }

        if (app.has("state")) {
            const state = app.resolve("state");
            if (state && state.forkedBlock && peer.ip === state.forkedBlock.ip) {
                return this.__determinePunishment(peer, offences.FORK);
            }
        }

        if (peer.commonBlocks === false) {
            delete peer.commonBlocks;

            return this.__determinePunishment(peer, offences.NO_COMMON_BLOCKS);
        }

        if (peer.commonId === false) {
            delete peer.commonId;

            return this.__determinePunishment(peer, offences.NO_COMMON_ID);
        }

        if (peer.socket.getState() !== peer.socket.OPEN) {
            return this.__determinePunishment(peer, offences.SOCKET_NOT_OPEN);
        }

        if (peer.socketError === SocketErrors.AppNotReady) {
            return this.__determinePunishment(peer, offences.APPLICATION_NOT_READY);
        }

        if (peer.delay === -1) {
            return this.__determinePunishment(peer, offences.TIMEOUT);
        }

        if (peer.delay > 2000) {
            return this.__determinePunishment(peer, offences.HIGH_LATENCY);
        }

        if (!this.isValidNetwork(peer)) {
            return this.__determinePunishment(peer, offences.INVALID_NETWORK);
        }

        if (!this.isValidVersion(peer)) {
            return this.__determinePunishment(peer, offences.INVALID_VERSION);
        }

        // NOTE: Suspending this peer only means that we no longer
        // will download blocks from him but he can still download blocks from us.
        const heightDifference = Math.abs(this.monitor.getNetworkHeight() - peer.state.height);

        if (heightDifference >= 153) {
            return this.__determinePunishment(peer, offences.INVALID_HEIGHT);
        }

        return this.__determinePunishment(peer, offences.UNKNOWN);
    }

    /**
     * Compile the information about the punishment the peer will face.
     * @param  {Object} peer
     * @param  {Object} offence
     * @return {Object}
     */
    public __determinePunishment(peer, offence) {
        if (this.isRepeatOffender(peer)) {
            offence = offences.REPEAT_OFFENDER;
        }

        const until = dato()[offence.period](offence.number);
        // @ts-ignore
        const untilDiff = until.diff(dato());

        this.logger.debug(
            `Suspended ${peer.ip} for ${prettyMs(untilDiff, {
                verbose: true,
            })} because of "${offence.reason}"`,
        );

        return {
            until,
            reason: offence.reason,
            weight: offence.weight,
        };
    }
}

export const guard = new Guard();
