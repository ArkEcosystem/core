export const defaults = {
    hosts: [
        {
            hostname: "127.0.0.1",
            port: parseInt(process.env.CORE_P2P_PORT!) || 4000,
        },
    ],
    tracker: false,
};
