export const defaults = {
    enabled: process.env.CORE_JSON_RPC_ENABLED,
    host: process.env.CORE_JSON_RPC_HOST || "0.0.0.0",
    port: process.env.CORE_JSON_RPC_PORT || 8080,
    allowRemote: false,
    whitelist: ["127.0.0.1", "::ffff:127.0.0.1"],
    database: {
        uri: process.env.CORE_JSON_RPC_DATABASE || `sqlite://${process.env.CORE_PATH_DATA}/database/json-rpc.sqlite`,
        options: {},
    },
};
