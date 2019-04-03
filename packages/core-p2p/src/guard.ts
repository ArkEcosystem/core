import { app } from "@arkecosystem/core-container";
import { Logger, P2P, Shared } from "@arkecosystem/core-interfaces";
import { dato } from "@faustbrian/dato";
import head from "lodash.head";
import sumBy from "lodash.sumby";
import prettyMs from "pretty-ms";
import semver from "semver";
import { config as localConfig } from "./config";
import { IOffence, IPunishment, ISuspensionList } from "./interfaces";
import { SocketErrors } from "./socket-server/constants";

export class Guard {
    // @TODO: mark this as private (O)
    public config: Shared.Config;
    // @TODO: mark this as private (O)
    public monitor: P2P.IMonitor;
    // @TODO: mark this as private (O)
    public suspensions: ISuspensionList = {};
    // @TODO: get rid of this and resolve options directly from the container
    private readonly appConfig = app.getConfig();
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    private readonly offences: Record<string, IOffence> = {
        BLACKLISTED: {
            number: 1,
            period: "addYears",
            reason: "Blacklisted",
            weight: 10,
            critical: true,
        },
        NO_COMMON_BLOCKS: {
            number: 5,
            period: "addMinutes",
            reason: "No Common Blocks",
            weight: 1,
            critical: true,
        },
        NO_COMMON_ID: {
            number: 5,
            period: "addMinutes",
            reason: "No Common Id",
            weight: 1,
            critical: true,
        },
        INVALID_VERSION: {
            number: 5,
            period: "addMinutes",
            reason: "Invalid Version",
            weight: 2,
        },
        INVALID_MILESTONE_HASH: {
            number: 5,
            period: "addMinutes",
            reason: "Invalid Milestones",
            weight: 2,
        },
        INVALID_HEIGHT: {
            number: 10,
            period: "addMinutes",
            reason: "Node is not at height",
            weight: 3,
        },
        INVALID_NETWORK: {
            number: 5,
            period: "addMinutes",
            reason: "Invalid Network",
            weight: 5,
            critical: true,
        },
        INVALID_STATUS: {
            number: 5,
            period: "addMinutes",
            reason: "Invalid Response Status",
            weight: 3,
        },
        TIMEOUT: {
            number: 2,
            period: "addMinutes",
            reason: "Timeout",
            weight: 2,
        },
        HIGH_LATENCY: {
            number: 1,
            period: "addMinutes",
            reason: "High Latency",
            weight: 1,
        },
        APPLICATION_NOT_READY: {
            number: 30,
            period: "addSeconds",
            reason: "Application is not ready",
            weight: 0,
        },
        TOO_MANY_REQUESTS: {
            number: 60,
            period: "addSeconds",
            reason: "Rate limit exceeded",
            weight: 0,
        },
        FORK: {
            number: 15,
            period: "addMinutes",
            reason: "Fork",
            weight: 10,
        },
        UNKNOWN: {
            number: 10,
            period: "addMinutes",
            reason: "Unknown",
            weight: 5,
        },
        REPEAT_OFFENDER: {
            number: 1,
            period: "addDays",
            reason: "Repeat Offender",
            weight: 100,
        },
        SOCKET_NOT_OPEN: {
            number: 5,
            period: "addMinutes",
            reason: "Socket not open",
            weight: 3,
        },
    };

    constructor() {
        this.config = localConfig;
    }

    public init(monitor: P2P.IMonitor) {
        this.monitor = monitor;

        return this;
    }

    public all(): ISuspensionList {
        return this.suspensions;
    }

    public get(ip: string): P2P.ISuspension {
        return this.suspensions[ip];
    }

    public delete(ip: string): void {
        delete this.suspensions[ip];
    }

    public suspend(peer): void {
        const whitelist = this.config.get("whitelist");
        if (whitelist && whitelist.includes(peer.ip)) {
            return;
        }

        if (!Array.isArray(peer.offences)) {
            peer.offences = [];
        }

        if (peer.offences.length > 0) {
            if (dato().isAfter((head(peer.offences) as any).until)) {
                peer.offences = [];
            }
        }

        const offence = this.determineOffence(peer);

        peer.offences.push(offence);

        this.suspensions[peer.ip] = {
            peer,
            until: offence.until,
            reason: offence.reason,
        };

        this.monitor.removePeer(peer);
    }

    public async unsuspend(peer): Promise<void> {
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

    public async resetSuspendedPeers(): Promise<void> {
        this.logger.info("Clearing suspended peers.");

        await Promise.all(Object.values(this.suspensions).map(suspension => this.unsuspend(suspension.peer)));
    }

    public isSuspended(peer: P2P.IPeer): boolean {
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

    public isWhitelisted(peer): boolean {
        return this.config.get("whitelist").includes(peer.ip);
    }

    public isBlacklisted(peer): boolean {
        return this.config.get("blacklist").includes(peer.ip);
    }

    public isValidVersion(peer): boolean {
        const version = peer.version || (peer.headers && peer.headers.version);
        if (!semver.valid(version)) {
            return false;
        }

        return this.config
            .get("minimumVersions")
            .some((minimumVersion: string) => semver.satisfies(version, minimumVersion));
    }

    public isValidNetwork(peer): boolean {
        const nethash = peer.nethash || (peer.headers && peer.headers.nethash);
        return nethash === this.appConfig.get("network.nethash");
    }

    public isValidPort(peer): boolean {
        return peer.port === this.config.get("port");
    }

    public isRepeatOffender(peer): boolean {
        return sumBy(peer.offences, "weight") >= 150;
    }

    private determineOffence(peer): IPunishment {
        if (this.isBlacklisted(peer)) {
            return this.determinePunishment(peer, this.offences.BLACKLISTED);
        }

        if (app.has("state")) {
            const state = app.resolve("state");
            if (state && state.forkedBlock && peer.ip === state.forkedBlock.ip) {
                return this.determinePunishment(peer, this.offences.FORK);
            }
        }

        if (peer.commonBlocks === false) {
            delete peer.commonBlocks;

            return this.determinePunishment(peer, this.offences.NO_COMMON_BLOCKS);
        }

        if (peer.commonId === false) {
            delete peer.commonId;

            return this.determinePunishment(peer, this.offences.NO_COMMON_ID);
        }

        if (peer.socket.getState() !== peer.socket.OPEN) {
            return this.determinePunishment(peer, this.offences.SOCKET_NOT_OPEN);
        }

        if (peer.socketError === SocketErrors.AppNotReady) {
            return this.determinePunishment(peer, this.offences.APPLICATION_NOT_READY);
        }

        if (peer.delay === -1) {
            return this.determinePunishment(peer, this.offences.TIMEOUT);
        }

        if (peer.delay > 2000) {
            return this.determinePunishment(peer, this.offences.HIGH_LATENCY);
        }

        if (!this.isValidNetwork(peer)) {
            return this.determinePunishment(peer, this.offences.INVALID_NETWORK);
        }

        if (!this.isValidVersion(peer)) {
            return this.determinePunishment(peer, this.offences.INVALID_VERSION);
        }

        // NOTE: Suspending this peer only means that we no longer
        // will download blocks from him but he can still download blocks from us.
        const heightDifference = Math.abs(this.monitor.getNetworkHeight() - peer.state.height);

        if (heightDifference >= 153) {
            return this.determinePunishment(peer, this.offences.INVALID_HEIGHT);
        }

        return this.determinePunishment(peer, this.offences.UNKNOWN);
    }

    private determinePunishment(peer, offence: IOffence): IPunishment {
        if (this.isRepeatOffender(peer)) {
            offence = this.offences.REPEAT_OFFENDER;
        }

        const until = dato()[offence.period](offence.number);
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
