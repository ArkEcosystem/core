import { app } from "@arkecosystem/core-container";
import { P2P } from "@arkecosystem/core-interfaces";
import dayjs from "dayjs";
import { SCClientSocket } from "socketcluster-client";
import { SocketErrors } from "./enums";
import { isValidVersion, isWhitelisted } from "./utils";

export class PeerGuard implements P2P.IPeerGuard {
    private readonly offences: Record<string, P2P.IOffence> = {
        noCommonBlocks: {
            until: () => dayjs().add(5, "minute"),
            reason: "No Common Blocks",
            severity: "critical",
        },
        invalidVersion: {
            until: () => dayjs().add(5, "minute"),
            reason: "Invalid Version",
        },
        invalidNetwork: {
            until: () => dayjs().add(5, "minute"),
            reason: "Invalid Network",
            severity: "critical",
        },
        invalidStatus: {
            until: () => dayjs().add(5, "minute"),
            reason: "Invalid Response Status",
        },
        highLatency: {
            until: () => dayjs().add(1, "minute"),
            reason: "High Latency",
        },
        failedBlocksDownload: {
            until: () => dayjs().add(30, "second"),
            reason: "Failed to download blocks",
        },
        tooManyRequests: {
            until: () => dayjs().add(60, "second"),
            reason: "Rate limit exceeded",
        },
        fork: {
            until: () => dayjs().add(15, "minute"),
            reason: "Fork",
        },
        socketGotClosed: {
            until: () => dayjs().add(5, "minute"),
            reason: "Socket got closed",
        },
    };

    constructor(private readonly connector: P2P.IPeerConnector) {}

    public punishment(offence: string): P2P.IPunishment {
        return this.createPunishment(this.offences[offence]);
    }

    public analyze(peer: P2P.IPeer): P2P.IPunishment {
        const state = app.resolvePlugin("state").getStore();

        if (state.forkedBlock && peer.ip === state.forkedBlock.ip) {
            return this.createPunishment(this.offences.fork);
        }

        const connection: SCClientSocket = this.connector.connection(peer);

        if (connection && connection.getState() !== connection.OPEN) {
            return this.createPunishment(this.offences.socketGotClosed);
        }

        if (this.connector.hasError(peer, SocketErrors.AppNotReady)) {
            return undefined;
        }

        if (peer.latency > 2000) {
            return this.createPunishment(this.offences.highLatency);
        }

        if (!isValidVersion(peer)) {
            return this.createPunishment(this.offences.invalidVersion);
        }

        return undefined;
    }

    public isWhitelisted(peer: P2P.IPeer): boolean {
        return isWhitelisted(app.resolveOptions("p2p").whitelist, peer.ip);
    }

    private createPunishment(offence: P2P.IOffence): P2P.IPunishment {
        return {
            until: offence.until(),
            reason: offence.reason,
            severity: offence.severity,
        };
    }
}
