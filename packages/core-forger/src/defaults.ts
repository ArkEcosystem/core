export const defaults = {
    hosts: [
        {
            hostname: "[::1]",
            port: process.env.CORE_P2P_PORT || 4000,
        },
    ],
    tracker: false,
};
