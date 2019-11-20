export const defaults = {
    hosts: [
        {
            hostname: "127.0.0.1",
            port: process.env.CORE_P2P_PORT || 4000,
        },
    ],
    tracker: !process.env.CORE_FORGER_TRACKER_DISABLED,
};
