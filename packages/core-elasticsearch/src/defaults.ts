export const defaults = {
    server: {
        host: "0.0.0.0",
        port: 4007,
        whitelist: ["*"],
    },
    client: {
        nodes: ["http://localhost:9200"],
    },
    chunkSize: 5000,
};
