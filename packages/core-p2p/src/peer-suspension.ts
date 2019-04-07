import { P2P } from "@arkecosystem/core-interfaces";
import { dato } from "@faustbrian/dato";

export class PeerSuspension implements P2P.IPeerSuspension {
    public constructor(readonly peer: P2P.IPeer, readonly punishment: P2P.IPunishment) {}

    public isLow(): boolean {
        return this.punishment.severity === "low";
    }

    public isMedium(): boolean {
        return this.punishment.severity === "medium";
    }

    public isHigh(): boolean {
        return this.punishment.severity === "high";
    }

    public isCritical(): boolean {
        return this.punishment.severity === "critical";
    }

    public hasExpired(): boolean {
        return dato().isAfter(this.punishment.until);
    }
}
