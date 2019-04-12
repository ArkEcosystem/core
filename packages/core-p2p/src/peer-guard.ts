import { app } from "@arkecosystem/core-container";
import { P2P } from "@arkecosystem/core-interfaces";
import { dato } from "@faustbrian/dato";
import semver from "semver";
import { SCClientSocket } from "socketcluster-client";
import { SocketErrors } from "./enums";

export class PeerGuard implements P2P.IPeerGuard {
    private readonly offences: Record<string, P2P.IOffence> = {
        noCommonBlocks: {
            until: () => dato().addMinutes(5),
            reason: "No Common Blocks",
            severity: "critical",
        },
        invalidVersion: {
            until: () => dato().addMinutes(5),
            reason: "Invalid Version",
        },
        invalidNetwork: {
            until: () => dato().addMinutes(5),
            reason: "Invalid Network",
            severity: "critical",
        },
        invalidStatus: {
            until: () => dato().addMinutes(5),
            reason: "Invalid Response Status",
        },
        timeout: {
            until: () => dato().addSeconds(30),
            reason: "Timeout",
        },
        highLatency: {
            until: () => dato().addMinutes(1),
            reason: "High Latency",
        },
        applicationNotReady: {
            until: () => dato().addSeconds(30),
            reason: "Application is not ready",
        },
        failedBlocksDownload: {
            until: () => dato().addSeconds(30),
            reason: "Failed to download blocks",
        },
        tooManyRequests: {
            until: () => dato().addSeconds(60),
            reason: "Rate limit exceeded",
        },
        fork: {
            until: () => dato().addMinutes(15),
            reason: "Fork",
        },
        socketNotOpen: {
            until: () => dato().addMinutes(5),
            reason: "Socket not open",
        },
        unknown: {
            until: () => dato().addMinutes(10),
            reason: "Unknown",
        },
    };

    constructor(private readonly connector: P2P.IPeerConnector) {}

    public punishment(offence: string): P2P.IPunishment {
        return this.createPunishment(this.offences[offence]);
    }

    public analyze(peer: P2P.IPeer): P2P.IPunishment {
        if (app.has("state")) {
            const state = app.resolve("state");

            if (state.forkedBlock && peer.ip === state.forkedBlock.ip) {
                return this.createPunishment(this.offences.fork);
            }
        }

        const connection: SCClientSocket = this.connector.connection(peer);

        if (connection && connection.getState() !== connection.OPEN) {
            return this.createPunishment(this.offences.socketNotOpen);
        }

        if (peer.socketError === SocketErrors.AppNotReady) {
            return this.createPunishment(this.offences.applicationNotReady);
        }

        if (peer.latency === -1) {
            return this.createPunishment(this.offences.timeout);
        }

        if (peer.latency > 2000) {
            return this.createPunishment(this.offences.highLatency);
        }

        if (!this.isValidNetwork(peer)) {
            return this.createPunishment(this.offences.invalidNetwork);
        }

        if (!this.isValidVersion(peer)) {
            return this.createPunishment(this.offences.invalidVersion);
        }

        return null;

        // @TODO: review and check if we keep it or not
        // return this.createPunishment(this.offences.unknown);
    }

    public isWhitelisted(peer: P2P.IPeer): boolean {
        return app.resolveOptions("p2p").whitelist.includes(peer.ip);
    }

    public isValidVersion(peer: P2P.IPeer): boolean {
        const version: string = (peer.version || (peer.headers && peer.headers.version)) as string;

        if (!semver.valid(version)) {
            return false;
        }

        return app
            .resolveOptions("p2p")
            .minimumVersions.some((minimumVersion: string) => semver.satisfies(version, minimumVersion));
    }

    public isValidNetwork(peer: P2P.IPeer): boolean {
        const nethash = peer.nethash || (peer.headers && peer.headers.nethash);

        return nethash === app.getConfig().get("network.nethash");
    }

    public isValidPort(peer: P2P.IPeer): boolean {
        return peer.port === app.resolveOptions("p2p").port;
    }

    private createPunishment(offence: P2P.IOffence): P2P.IPunishment {
        return {
            until: offence.until(),
            reason: offence.reason,
            severity: offence.severity,
        };
    }
}
