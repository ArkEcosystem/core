export const defaults = {
    hosts: [
        {
            port: process.env.CORE_P2P_PORT || 4000,
            ip: "127.0.0.1",
        },
    ],
};
