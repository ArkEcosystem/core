import os from "os";

/**
 * Checks if IP belongs to local computer (all network interfaces are checked)
 */
export const isMyself = (ipAddress: string): boolean => {
    if (!ipAddress) {
        return false;
    }

    const interfaces = os.networkInterfaces();

    return (
        ipAddress.startsWith("127.") ||
        ipAddress.startsWith("0.") ||
        Object.keys(interfaces).some(ifname => interfaces[ifname].some(iface => iface.address === ipAddress))
    );
};
