import { parse, process } from "ipaddr.js";
import os from "os";

import { SATOSHI } from "../constants";
import { NetworkConfigManager } from "../managers";
import { MilestoneManager } from "../managers/milestone-manager";

export class NetworkUtils<T> {
    private genesisTransactions: { [key: string]: boolean };
    private whitelistedBlockAndTransactionIds: { [key: string]: boolean };

    public constructor(
        private networkConfigManager: NetworkConfigManager<T>,
        private milestoneManager: MilestoneManager<T>,
    ) {
        this.genesisTransactions = this.networkConfigManager
            .get("genesisBlock.transactions")
            .reduce((acc, curr) => Object.assign(acc, { [curr.id]: true }), {});

        this.whitelistedBlockAndTransactionIds = [
            ...(this.networkConfigManager.get("exceptions.blocks") || []),
            ...(this.networkConfigManager.get("exceptions.transactions") || []),
        ].reduce((acc, curr) => Object.assign(acc, { [curr]: true }), {});
    }

    /**
     * Get human readable string from satoshis
     * TODO: specify BigNumber type properly here (formely from @arkecosystem/utils)
     */
    public formatSatoshi(amount: any): string {
        const localeString = (+amount / SATOSHI).toLocaleString("en", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 8,
        });

        return `${localeString} ${this.networkConfigManager.get("network.client.symbol")}`;
    }

    /**
     * Check if the given block or transaction id is an exception.
     */
    public isException(id: number | string | undefined): boolean {
        if (!id) {
            return false;
        }

        return !!this.whitelistedBlockAndTransactionIds[id];
    }

    public isGenesisTransaction(id: string): boolean {
        return this.genesisTransactions[id];
    }

    public maxVendorFieldLength(height?: number): number {
        return this.milestoneManager.getMilestone(height).vendorFieldLength;
    }

    public isSupportedTransactionVersion(version: number): boolean {
        const aip11: boolean = this.milestoneManager.getMilestone().aip11;

        if (aip11 && version !== 2) {
            return false;
        }

        if (!aip11 && version !== 1) {
            return false;
        }

        return true;
    }

    public isLocalHost(ip: string, includeNetworkInterfaces: boolean = true): boolean {
        try {
            const parsed = parse(ip);
            if (parsed.range() === "loopback" || ip.startsWith("0") || ["127.0.0.1", "::ffff:127.0.0.1"].includes(ip)) {
                return true;
            }

            if (includeNetworkInterfaces) {
                const interfaces: {
                    [index: string]: os.NetworkInterfaceInfo[];
                } = os.networkInterfaces();

                return Object.keys(interfaces).some((ifname) =>
                    interfaces[ifname].some((iface) => iface.address === ip),
                );
            }

            return false;
        } catch (error) {
            return false;
        }
    }

    public isValidPeer(
        peer: { ip: string; status?: string | number },
        includeNetworkInterfaces: boolean = true,
    ): boolean {
        const sanitizedAddress: string | undefined = this.sanitizeRemoteAddress(peer.ip);

        if (!sanitizedAddress) {
            return false;
        }

        peer.ip = sanitizedAddress;

        if (this.isLocalHost(peer.ip, includeNetworkInterfaces)) {
            return false;
        }

        return true;
    }

    private sanitizeRemoteAddress(ip: string): string | undefined {
        try {
            return process(ip).toString();
        } catch (error) {
            return undefined;
        }
    }
}
